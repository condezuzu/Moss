// La sección de Ascent (spec/ascent.md, «Ascent en Progreso», para aprobar), arriba de Progreso, como si Progreso
// siguiera para arriba (lo pediste el 5/11/2026): arriba de todo del scroll de Progreso, arrastrar para abajo la
// baja siguiendo al dedo, como se sube a tu universo desde Hábitos, y Progreso baja pegado a ella. Se llega por
// abajo, a lo principal (lo de hoy, o vincular); subiendo está el resto y, arriba de todo, de fondo, el cuerpo de
// tu rango, como las estrellas. En el encabezado de Progreso está la entrada: el planeta de Ascent con su órbita y
// la luna de Moss, con lo de hoy en una línea; arriba de todo asoma el borde del planeta. Volver es bajar: abajo
// de todo, empujando para arriba (con la rueda, para abajo), con «Volver a Progreso» o tocando Progreso.
// Tiene el lenguaje de Ascent (spec/estetica.md de su repo): un titular grande sin caja, línea y aire,
// octágono donde algo es la acción, píldora para lo que se elige y lo secundario subrayado.
// Revisada con la evidencia el 5/11/2026 (spec/rendimiento.md, «Lo que cambió»): sin porcentajes de
// recuperación ni probabilidades de marca. Vinculada: el titular del día, con lo que decide hoy
// (Recuperado.titularDeHoy) y cómo te sientes, en qué concentrarte (Diagnostico.focoDeHoy), de qué sale (el
// sueño, los músculos de hoy y la comida, con sus datos), tus músculos en un cuerpo dibujado (Fatiga), tu
// fuerza con la tendencia de cada ejercicio y su rango (Rendimiento.tendenciaDeFuerza), las marcas sin
// probabilidad, el estancamiento con sus razones (Estancados), tu año, lo que comparten las dos y en qué se
// basa. Sin vincular, cada cosa se ve vacía, con su candado. La invitación de Inicio sale de SenalDeAscent.

const SeccionAscent = (() => {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // La hora de cada comida, si no se anotó: la típica de la app.
  const HORA_DE_COMIDA = Comidas.HORA_TIPICA;
  // Lo de siempre de la persona de mentira: sin sesión hoy, lo de hoy se mira a la hora de despertarse.
  const DESPERTAR = 7 * 60 + 30;
  const DORMIR = 23 * 60 + 30;
  // Lo que tarda en dormirse: lo que aprendió Moss, como dice Perfil › Avisos.
  const LATENCIA = 20;
  // El cuerpo de tu rango, arriba: cuánto cuelga del borde cuando se lo ve entero; cuánto más arriba queda lejos de
  // arriba de todo (asoma apenas: del polvo, su luz) y cuánto hay que subir para verlo entero; y qué parte del camino
  // de la sección hace al bajar (está más lejos).
  const CUERPO_PX = 104;
  const CUERPO_LEJOS = 80;
  const NUBE_LEJOS = 210;
  const CUERPO_SUBIR = 520;
  const CUERPO_SIGUE = 0.38;
  // El polvo, una nube, en píxeles: su tamaño, cuánto se estira y, cuando se la ve entera, dónde queda su centro.
  const NUBE = { ancho: 560, alto: 380, rx: 230, ry: 150, centro: 150 };
  // El borde del planeta que asoma arriba de Progreso: cuánto se ve quieto y cuánto baja con el dedo.
  const TECHO_PX = 7;
  const TECHO_BAJA = 150;
  // Los grupos del mapa del año, en el orden de la leyenda.
  const GRUPOS_DEL_ANIO = ['pecho', 'piernas', 'espalda'];
  // La barra del sueño va de 0 a 10 horas.
  const SUENO_TOPE = 10 * 60;
  // La escala de la proteína, en g por kilo por día.
  const PROTEINA_TOPE = 2.6;

  const CORTE = (c) => `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;
  const CORTE_ARRIBA = (c) => `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, 0 100%, 0 ${c}px)`;

  // Lo cargado (y lo que pone el límite hoy) es lo único con color, en terracota; lo que se recupera va en crema y
  // lo descansado, apenas. Los grupos del año, tres tonos apagados que pasan las comprobaciones de la skill dataviz
  // de a pares (daltonismo y visión normal) sobre el fondo de Ascent.
  const CSS = `
.tel .ascent, .as-entrada, .as-techo, .tel .hb.as-hoja {
  --as-fondo: #05060a; --as-hoja: #0b0d13; --as-tinta: #e8ecf6; --as-sub: #aab2c4; --as-apagado: #9098ab; --as-tenue: #4a5163;
  --as-linea: #303748; --as-linea-fuerte: #3e4659; --as-principal: var(--rango-principal, #7e8ca8); --as-claro: var(--rango-claro, #c4c2ba); --as-lejos: #cb8569;
  --as-f-atencion: #cb8569; --as-f-aceptable: #5a6176; --as-f-bien: #8b94aa; --as-f-muyBien: #d2cfc5;
  --as-g-pecho: #419ec6; --as-g-piernas: #a77e33; --as-g-espalda: #765190;
}
/* El cielo sigue detrás, como a tu universo; apenas oscurecido para leer. */
.tel .ascent { visibility: hidden; color: var(--as-tinta); will-change: transform; background: linear-gradient(180deg, rgba(5, 6, 10, 0.5) 0, rgba(5, 6, 10, 0.42) 240px, rgba(5, 6, 10, 0.6) 100%); }
.tel .ascent::after { display: none; }
.as-velo { position: absolute; inset: 0; z-index: 2; background: #020308; opacity: 0; pointer-events: none; }
/* Se llega por abajo: lo principal queda pegado abajo y, arriba, el cielo con tu cuerpo (el espacio de arriba es
   para verlo entero). Lo que sube se apaga contra el borde de arriba. */
.as-scroll { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior: contain; padding: calc(var(--arriba) + ${CUERPO_PX + 120}px) 22px calc(var(--pestanas) + 14px); scrollbar-width: none; touch-action: pan-y;
  -webkit-mask-image: linear-gradient(180deg, transparent calc(var(--arriba) - 14px), #000 calc(var(--arriba) + 36px)); mask-image: linear-gradient(180deg, transparent calc(var(--arriba) - 14px), #000 calc(var(--arriba) + 36px)); }
.as-scroll::-webkit-scrollbar { display: none; }
.as-contenido { margin-top: auto; }

/* La marca: el ícono de Ascent tal cual (5/11, con el ícono de referencia): el planeta oscuro con la luz en el
   borde de arriba a la izquierda, la órbita plateada abierta a la izquierda y el punto blanco arriba a la derecha.
   Sin vincular, apagada; al vincular, se enciende. No cambia con el rango: es la marca. */
/* Sin el trazo de los íconos de la galería (.pagina-app svg), que va después y les dibujaba un aro. */
.pagina-app svg.as-marca, .pagina-app svg.as-marca-chica { stroke: none !important; fill: none; }
.as-marca { overflow: visible; }
/* Lo principal, abajo: con la marca arriba a la derecha y una línea de pelo que lo separa de lo que sigue arriba. */
.as-base { position: relative; margin-top: 30px; padding-top: 14px; }
.as-base::before { content: ''; position: absolute; left: -22px; right: -22px; top: 0; border-top: 1px solid var(--as-linea); }
.as-base > .as-marca { position: absolute; right: -6px; top: 20px; width: 76px; height: 76px; transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1), height 0.7s cubic-bezier(0.16, 1, 0.3, 1), top 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.ascent.vinculada .as-base > .as-marca { top: 8px; width: 46px; height: 46px; }
.as-marca-brillo { filter: blur(1.8px); }
.as-orbita { fill: none; stroke-width: 2.2; stroke-linecap: round; opacity: 0.6; transition: opacity 0.9s ease; }
.as-marca.unida .as-orbita { opacity: 1; }
.as-luna { opacity: 0.72; transition: opacity 0.9s; }
.as-marca.unida .as-luna { opacity: 1; }
.as-luna-halo { fill: rgba(255, 255, 255, 0.22); filter: blur(2.6px); opacity: 0; transition: opacity 1s 0.3s; }
.as-marca.unida .as-luna-halo { opacity: 1; }
.as-marca-chica { width: 24px; height: 24px; flex: none; overflow: visible; }
.as-chica-orbita { fill: none; stroke: #a7adb7; stroke-width: 1; stroke-linecap: round; }
.as-chica-luna { fill: #f4f6f9; }

/* El cuerpo de tu rango en Ascent, arriba, de fondo (lo pediste el 5/11/2026: subes desde Progreso y lo encuentras
   arriba, como las estrellas). El polvo es una nube; los demás cuelgan del borde de arriba, como el borde que asoma
   en Progreso (el mismo dibujo del horizonte, dado vuelta: cuerpoDelHorizonte). Va detrás del texto, baja con la
   sección más despacio que ella (está más lejos) y se acerca a medida que subes. El borde y el resplandor toman el
   color del rango. */
.as-cielo { position: absolute; left: 0; right: 0; top: 0; height: 62%; z-index: 0; overflow: hidden; pointer-events: none; --baja: 0px; --cerca: 1; }
.as-cielo i { opacity: var(--cerca); }
.as-cielo i { position: absolute; left: 62%; top: ${CUERPO_PX - 944}px; width: 944px; height: 944px; margin-left: -472px; border-radius: 50%; overflow: hidden; background: #05060a; box-shadow: 0 0 30px rgba(var(--rango-borde-rgb, 196, 194, 186), 0.15), inset 0 18px 44px rgba(var(--rango-borde-rgb, 196, 194, 186), 0.07); transform: translateY(var(--baja)) rotate(180deg); will-change: transform; transition: box-shadow 0.8s; }
.as-cielo i > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
/* Sin el trazo de los íconos de la galería (.pagina-app svg). */
.pagina-app .as-cielo svg { stroke: none !important; fill: none; }
/* La galaxia no tiene cuerpo: son partículas, y el borde apenas se insinúa. */
.as-cielo.sin-cuerpo i { background: transparent; box-shadow: none; }
.as-cielo.sin-cuerpo i::before { opacity: 0.3; }
.as-cielo.brilla i { box-shadow: 0 0 46px rgba(242, 194, 48, 0.42), 0 0 120px rgba(239, 159, 39, 0.2), inset 0 18px 44px rgba(255, 241, 194, 0.2); }
.as-cielo.negro i { background: #020204; box-shadow: 0 0 36px rgba(167, 139, 250, 0.24), 0 0 10px rgba(255, 106, 0, 0.4); }
.as-cielo i > svg.entra { animation: as-cuerpo-entra 0.8s ease both; }
@keyframes as-cuerpo-entra { from { opacity: 0; } }
.as-cielo i::before { content: ''; position: absolute; inset: 0; z-index: 1; border-radius: 50%; background: conic-gradient(from -40deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.12) 0deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.86) 24deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.34) 46deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.04) 70deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0) 320deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.12) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); }
/* El polvo: una nube, sin círculo ni borde, con la estrella que nace en el medio, que respira; los granos derivan. */
.as-cielo.polvo i { left: 66%; top: ${NUBE.centro - NUBE.alto / 2}px; width: ${NUBE.ancho}px; height: ${NUBE.alto}px; margin-left: -${NUBE.ancho / 2}px; border-radius: 0; overflow: visible; background: none; box-shadow: none; transform: translateY(var(--baja)); }
.as-cielo.polvo i::before { display: none; }
.as-cielo i > svg.as-polvo-granos { animation: as-cuerpo-entra 0.8s ease both, as-polvo-deriva 60s ease-in-out -30s infinite alternate; will-change: transform; }
@keyframes as-polvo-deriva { from { transform: translateX(-6px); } to { transform: translateX(6px); } }
.as-polvo-estrella { position: absolute; width: 84px; height: 84px; margin: -42px 0 0 -42px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 241, 220, 0.85) 0, rgba(243, 180, 124, 0.42) 12%, rgba(196, 122, 88, 0.12) 34%, rgba(196, 122, 88, 0) 68%); mix-blend-mode: screen; animation: as-polvo-respira 7s ease-in-out infinite; will-change: transform, opacity; }
.as-polvo-estrella::after { content: ''; position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px; border-radius: 50%; background: #fff4e4; }
@keyframes as-polvo-respira { 50% { transform: scale(1.14); opacity: 0.82; } }

/* Arriba de Progreso asoma el borde del planeta, colgado: Ascent está arriba. Baja con el dedo. */
.as-techo { position: absolute; left: 0; right: 0; top: 0; height: 190px; z-index: 2; overflow: hidden; pointer-events: none; opacity: 0; --baja: 0px; }
.as-techo i { position: absolute; left: 62%; bottom: calc(100% - ${TECHO_PX}px - var(--baja)); width: 760px; height: 760px; margin-left: -380px; border-radius: 50%; background: radial-gradient(circle at 50% 100%, #161922 0, #0b0c12 30%, #05060a 64%); box-shadow: 0 6px 28px rgba(var(--rango-borde-rgb, 196, 194, 186), 0.16); }
.as-techo i::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 120deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0) 0deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.45) 34deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.95) 58deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0.4) 82deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0) 118deg, rgba(var(--rango-borde-rgb, 232, 228, 212), 0) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); }
/* Del polvo asoma su luz, no un borde. */
.as-techo.polvo i { background: radial-gradient(closest-side at 50% 100%, rgba(138, 107, 214, 0.5) 0, rgba(43, 61, 140, 0.22) 40%, rgba(5, 6, 10, 0) 100%); box-shadow: 0 8px 30px rgba(138, 107, 214, 0.22); }
.as-techo.polvo i::before { display: none; }

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
.as-orbe-halo { fill: rgba(255, 255, 255, 0.2); }
/* Sin vincular, el ícono: la órbita abierta a la izquierda y el punto arriba a la derecha. */
.as-orbe-abierta { fill: none; stroke: #9ea4ae; stroke-width: 1.7; stroke-linecap: round; opacity: 0; transition: opacity 0.6s; }
.as-entrada.sin .as-orbe-abierta { opacity: 0.9; }
.as-entrada.sin .as-orbe-pista { opacity: 0; }
.as-entrada.sin .as-orbe-arco { opacity: 0; }
.as-entrada.sin .as-orbe-luna { transform: rotate(50.2deg) translateY(-19px); opacity: 0.9; }
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
.as-etq.as-nombre { margin: 4px 0 12px; color: var(--as-claro); }

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


/* El titular del día, grande y sin caja: arriba, la sesión; debajo, en una o dos líneas, el porqué. */
.as-hoy { margin-top: 2px; }
.as-hoy-sesion { margin: 0; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; color: var(--as-sub); }
.as-hoy-titulo { margin: 10px 0 0; font: 200 33px/1.08 var(--numeros); letter-spacing: -0.015em; color: var(--as-claro); text-wrap: balance; }
.as-hoy-texto { margin: 10px 0 0; font: 400 15px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.as-hoy-titulo.as-cambia, .as-hoy-texto.as-cambia, .as-decide-valor.as-cambia, .as-foco.as-cambia, .as-cuerpo-detalle.as-cambia { animation: as-entra 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }

/* Lo que decide hoy: la noche, lo que entrenas y cómo te sientes. Lo que pone el límite lleva el único color. */
.as-decide { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 22px 0 0; padding: 14px 0 0; border-top: 1px solid rgba(48, 55, 72, 0.6); list-style: none; }
.as-decide li { display: grid; gap: 6px; align-content: start; min-width: 0; }
.as-decide-icono { width: 30px; height: 30px; display: grid; place-items: center; box-sizing: border-box; border-radius: 50%; border: 1px solid var(--as-linea-fuerte); color: var(--as-sub); transition: color 0.5s, border-color 0.5s, background-color 0.5s; }
.as-decide-icono svg { width: 16px; height: 16px; stroke-width: 1.7; }
.as-decide li.limita .as-decide-icono { color: var(--as-lejos); border-color: rgba(203, 133, 105, 0.6); background: rgba(203, 133, 105, 0.08); }
.as-decide-nombre { font: 400 11px/1.2 var(--texto); color: var(--as-sub); }
.as-decide-valor { font: 400 14px/1.2 var(--texto); color: var(--as-tinta); transition: color 0.5s; }
.as-decide li.limita .as-decide-valor { color: var(--as-lejos); }

/* Tu último entreno: los músculos que trabajó, en un cuerpo chico y en palabras. */
.as-ultimo { display: grid; grid-template-columns: 84px minmax(0, 1fr); align-items: center; column-gap: 12px; margin: 18px 0 0; }
.as-ultimo .as-cuerpo-svg { width: 84px; height: auto; }
.as-ultimo-etq { display: block; font: 400 11.5px/1.2 var(--texto); color: var(--as-sub); }
.as-ultimo-texto { display: block; margin-top: 4px; font: 400 14.5px/1.3 var(--texto); color: var(--as-tinta); text-wrap: pretty; }

/* ¿Cómo te sientes para entrenar? De 0 a 10, en píldoras. */
.as-siente { margin: 18px 0 0; }
.as-siente-pregunta { margin: 0; font: 400 13.5px/1.3 var(--texto); color: var(--as-tinta); }
.as-siente-escala { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 3px; margin-top: 10px; }
.as-siente-escala button { appearance: none; cursor: pointer; height: 30px; padding: 0; border: 1px solid var(--as-linea-fuerte); border-radius: 999px; background: none; color: var(--as-sub); font: 400 12px/1 var(--numeros); font-variant-numeric: tabular-nums; transition: background-color 0.25s, color 0.25s, border-color 0.25s; }
.as-siente-escala button[aria-pressed="true"] { background: var(--as-claro); border-color: var(--as-claro); color: var(--as-fondo); }
.as-siente-extremos { display: flex; justify-content: space-between; margin-top: 6px; font: 400 10.5px/1.2 var(--texto); color: var(--as-apagado); }

/* De qué sale: el sueño, los músculos de hoy y la comida, en filas sin cajas, con sus datos. */
.as-filas { margin: 30px -22px 0; padding: 14px 22px 0; border-top: 1px solid var(--as-linea); }
.as-fila { padding: 16px 0 18px; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-etq + .as-fila { border-top: 0; padding-top: 10px; }
.as-fila-cab { display: flex; align-items: baseline; gap: 9px; }
.as-fila-nombre { margin: 0; font: 400 16.5px/1.2 var(--texto); color: var(--as-tinta); }
.as-fila-valor { font: 300 15px/1 var(--numeros); color: var(--as-sub); font-variant-numeric: tabular-nums; white-space: nowrap; }
.as-fila-palabra { margin-left: auto; font: 400 13.5px/1.2 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.as-fila-palabra.limita { color: var(--as-lejos); }
.as-fila-texto { margin: 10px 0 0; font: 400 13.5px/1.4 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-fila-consejo { margin: 7px 0 0; font: 400 13.5px/1.4 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.as-fila .as-nota { margin-top: 7px; }
.as-fila .as-enlace { margin-top: 10px; }

/* Una escala en una línea: lo de hoy hasta su punto, y los umbrales como rayas con su nombre. */
.as-escala { position: relative; height: 30px; margin-top: 12px; }
.as-escala-zona { position: absolute; top: 4px; height: 6px; background: rgba(203, 133, 105, 0.14); }
.as-escala-pista { position: absolute; left: 0; right: 0; top: 6px; height: 2px; background: var(--as-linea); }
.as-escala-lleno { position: absolute; left: 0; top: 6px; height: 2px; background: var(--as-claro); transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.as-escala.limita .as-escala-lleno { background: var(--as-lejos); }
.as-escala-punto { position: absolute; top: 2px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--as-tinta); box-shadow: 0 0 0 2.5px #090b11; transition: left 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.as-escala.limita .as-escala-punto { background: var(--as-lejos); }
.as-escala-raya { position: absolute; top: 1px; width: 1px; height: 12px; background: var(--as-linea-fuerte); }
.as-escala-raya span { position: absolute; top: 16px; left: 0; translate: -50% 0; font: 400 10.5px/1 var(--texto); color: var(--as-apagado); white-space: nowrap; }

/* Los músculos de hoy, en píldoras con su estado. */
.as-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 11px 0 0; padding: 0; list-style: none; }
.as-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px 5px 8px; border-radius: 999px; border: 1px solid var(--as-linea-fuerte); font: 400 12.5px/1 var(--texto); color: var(--as-tinta); transition: border-color 0.5s; }
.as-chip i { width: 8px; height: 8px; border-radius: 50%; background: rgba(170, 178, 196, 0.28); transition: background-color 0.5s; }
.as-chip.recuperandose i { background: var(--as-claro); }
.as-chip.cargado { border-color: rgba(203, 133, 105, 0.55); }
.as-chip.cargado i { background: var(--as-lejos); }
.as-chips.chicas { margin-top: 6px; gap: 4px; }
.as-chips.chicas .as-chip { padding: 3px 8px 3px 6px; font-size: 11.5px; }

/* Tus músculos: el cuerpo de frente y de espalda, cada músculo con su estado; tocar uno dice cuándo va a estar. */
.as-cuerpo { display: grid; justify-items: center; margin-top: 10px; }
.as-cuerpo .as-cuerpo-svg { width: 100%; max-width: 290px; height: auto; }
/* Sin el trazo de los íconos de la galería (.pagina-app svg): el cuerpo y la tendencia tienen el suyo. */
.pagina-app svg.as-cuerpo-svg, .pagina-app .as-fuerza-ej svg { stroke: none !important; fill: none; }
.as-cuerpo-svg { overflow: visible; }
.as-cuerpo-base { fill: rgba(170, 178, 196, 0.1); }
.as-cuerpo-rotulo { fill: var(--as-apagado); font: 400 7.5px/1 var(--texto); text-anchor: middle; }
.as-m { fill: rgba(170, 178, 196, 0.2); stroke: #07080d; stroke-width: 0.9; transition: fill 0.6s ease, fill-opacity 0.6s ease; }
.as-cuerpo .as-m { cursor: pointer; }
.as-m.recuperandose { fill: var(--as-claro); fill-opacity: 0.6; }
.as-m.cargado { fill: var(--as-lejos); }
.as-m.trabajado { fill: var(--as-claro); fill-opacity: 0.85; }
.as-m.elegido { stroke: var(--as-tinta); stroke-width: 1.3; }
.as-cuerpo-detalle { min-height: 38px; margin: 10px 0 0; font: 400 13px/1.4 var(--texto); color: var(--as-tinta); text-align: center; text-wrap: balance; }
.as-leyenda-cuerpo { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; font: 400 11px/1 var(--texto); color: var(--as-sub); }
.as-leyenda-cuerpo span { display: inline-flex; align-items: center; gap: 6px; }
.as-leyenda-cuerpo i { width: 9px; height: 9px; border-radius: 50%; background: rgba(170, 178, 196, 0.28); }
.as-leyenda-cuerpo i.recuperandose { background: var(--as-claro); opacity: 0.8; }
.as-leyenda-cuerpo i.cargado { background: var(--as-lejos); }
.ascent:not(.vinculada) .as-m { fill: rgba(170, 178, 196, 0.1); }
.ascent:not(.vinculada) .as-chip { color: var(--as-apagado); border-color: var(--as-linea); }

/* Tu semana en Ascent: cada día de la rutina con sus músculos, cómo están ahora. */
.as-semana { margin: 16px 0 0; padding: 0; list-style: none; }
.as-semana > li { display: grid; grid-template-columns: 64px minmax(0, 1fr); column-gap: 10px; align-items: start; padding: 10px 0; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-semana-dia { padding-top: 2px; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: var(--as-sub); }
.as-semana > li.hoy .as-semana-dia { color: var(--as-tinta); }
.as-semana-nombre { font: 400 13.5px/1.3 var(--texto); color: var(--as-tinta); }

/* Tu fuerza: cada ejercicio con su tendencia de 12 semanas, la recta con su rango y cada sesión en un punto. */
.as-fuerza-lista { margin: 8px 0 0; padding: 0; list-style: none; }
.as-fuerza-ej { display: grid; grid-template-columns: minmax(0, 1fr) 128px; column-gap: 12px; align-items: center; padding: 12px 0; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-fuerza-ej:first-child { border-top: 0; }
.as-fuerza-nombre { display: block; font: 400 15px/1.2 var(--texto); color: var(--as-tinta); }
.as-fuerza-veredicto { display: block; margin-top: 4px; font: 400 13px/1.3 var(--texto); color: var(--as-tinta); }
.as-fuerza-ej.sube .as-fuerza-veredicto { color: var(--as-claro); }
.as-fuerza-ej.noSeSabe .as-fuerza-veredicto { color: var(--as-sub); }
.as-fuerza-dato { display: block; margin-top: 3px; font: 400 11.5px/1.3 var(--texto); color: var(--as-sub); font-variant-numeric: tabular-nums; }
.as-fuerza-ej svg { width: 128px; height: 48px; overflow: visible; }
.as-spark-banda { fill: var(--as-claro); fill-opacity: 0.16; }
.as-spark-recta { fill: none; stroke: var(--as-claro); stroke-width: 1.6; stroke-linecap: round; }
.as-fuerza-ej.noSeSabe .as-spark-recta { stroke: var(--as-apagado); stroke-dasharray: 2 3; }
.as-spark-punto { fill: var(--as-tinta); }
.as-spark-vacio { fill: none; stroke: var(--as-linea-fuerte); stroke-width: 1; stroke-dasharray: 2 3; }

/* Marcas, sin probabilidad: tu nivel de hoy con lo que cambia de un día a otro, y tu marca como una raya. */
.as-marca2 { padding: 13px 0 14px; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-marcas .as-una + .as-marca2 { border-top: 0; }
.as-marca2-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-marca2-nombre { font: 400 15px/1.2 var(--texto); color: var(--as-tinta); }
.as-marca2-estado { font: 400 13px/1.2 var(--texto); color: var(--as-sub); white-space: nowrap; }
.as-marca2.cerca .as-marca2-estado { color: var(--as-claro); }
.as-alcance { position: relative; height: 22px; margin-top: 9px; }
.as-alcance-pista { position: absolute; left: 0; right: 0; top: 10px; height: 2px; background: var(--as-linea); }
.as-alcance-ruido { position: absolute; top: 5px; height: 12px; border-radius: 999px; background: var(--as-claro); opacity: 0.2; transition: left 0.7s cubic-bezier(0.16, 1, 0.3, 1), width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.as-alcance-nivel { position: absolute; top: 6px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--as-tinta); box-shadow: 0 0 0 2.5px #090b11; transition: left 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.as-alcance-marca { position: absolute; top: 1px; width: 2px; height: 20px; margin-left: -1px; background: var(--as-claro); }
.as-alcance-eje { display: flex; justify-content: space-between; gap: 12px; margin-top: 4px; font: 400 11px/1.2 var(--texto); color: var(--as-sub); }
.as-alcance-eje span { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.as-alcance-eje span.hoy::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--as-tinta); }
.as-alcance-eje span.marca::before { content: ''; width: 2px; height: 11px; background: var(--as-claro); }
.as-marca2-linea { margin: 8px 0 0; font: 400 13px/1.35 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-marca2.si .as-marca2-linea { color: var(--as-tinta); }
.as-condiciones { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0 0; padding: 0; list-style: none; }
.as-condicion { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px 4px 7px; border-radius: 999px; border: 1px solid var(--as-linea-fuerte); font: 400 11.5px/1 var(--texto); color: var(--as-sub); }
.as-condicion svg { width: 12px; height: 12px; stroke-width: 2; }
.as-condicion.si { color: var(--as-tinta); border-color: rgba(210, 207, 197, 0.36); }
.as-condicion.no { color: var(--as-lejos); border-color: rgba(203, 133, 105, 0.5); }
.as-frecuencia { display: flex; align-items: center; gap: 10px; margin-top: 10px; font: 400 12px/1.3 var(--texto); color: var(--as-sub); }
.as-cuadros { display: inline-flex; flex-wrap: wrap; gap: 3px; flex: none; }
.as-cuadros i { width: 7px; height: 7px; box-sizing: border-box; border: 1px solid var(--as-apagado); }
.as-cuadros i.lleno { background: var(--as-claro); border-color: var(--as-claro); }

/* Razones de estancamiento: cada ejercicio con sus razones, de la más a la menos sólida, con sus números. */
.as-estanc-ej { padding: 14px 0 8px; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-estanc .as-una + .as-estanc-ej { border-top: 0; }
.as-estanc-ej-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-estanc-ej-nombre { font: 400 15.5px/1.2 var(--texto); color: var(--as-tinta); }
.as-estanc-ej-dato { font: 400 12px/1.2 var(--texto); color: var(--as-sub); text-align: right; font-variant-numeric: tabular-nums; }
.as-razones { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 14px; }
.as-razon { display: grid; gap: 6px; }
.as-razon-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-razon-cab b { font: 400 13.5px/1.3 var(--texto); font-weight: 400; color: var(--as-tinta); }
.as-razon-cab span { font: 400 12px/1.2 var(--numeros); color: var(--as-sub); white-space: nowrap; font-variant-numeric: tabular-nums; }
.as-razon p { margin: 0; font: 400 12.5px/1.38 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-barras { display: flex; align-items: flex-end; gap: 3px; height: 38px; }
.as-barras i { flex: 1; min-width: 3px; background: var(--as-claro); opacity: 0.7; transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.as-barras i.ahora { background: none; box-shadow: inset 0 0 0 1.2px var(--as-principal); opacity: 1; }
.as-barras b { flex: none; width: 1px; align-self: stretch; margin: 0 4px; background: var(--as-linea-fuerte); }
.as-leyenda { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font: 400 11px/1 var(--texto); color: var(--as-sub); }
.as-leyenda span::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 6px; vertical-align: -0.5px; box-sizing: border-box; background: var(--as-linea-fuerte); }
.as-leyenda .as-leyenda-con::before { background: var(--as-claro); opacity: 0.7; }
.as-leyenda .as-leyenda-ahora::before { background: none; box-shadow: inset 0 0 0 1.2px var(--as-principal); }
.as-razon-sin { margin: 10px 0 0; font: 400 13px/1.35 var(--texto); color: var(--as-sub); }
.as-contexto { margin: 12px 0 2px; font: 400 12.5px/1.4 var(--texto); color: var(--as-apagado); text-wrap: pretty; }

/* Vinculada, la entrada dice lo de hoy en dos palabras, sin número. */
.as-entrada.vinculo .as-entrada-cifra { font: 400 13.5px/1.15 var(--texto); color: var(--as-tinta); }

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


/* En qué se basa: se despliega al final, con cada regla y de dónde sale. */
.as-como { margin: 30px -22px 0; padding: 0 22px; border-top: 1px solid var(--as-linea); }
.as-como-cab { appearance: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 16px 0; border: 0; background: none; color: var(--as-sub); font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; }
.as-como-cab svg { width: 16px; height: 16px; stroke-width: 1.8; transition: transform 0.3s; }
.as-como.abierta .as-como-cab svg { transform: rotate(180deg); }
.as-como-cuerpo { overflow: hidden; padding-bottom: 6px; }
.as-como-cuerpo p { margin: 0 0 12px; font: 400 13px/1.45 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-como-cuerpo p b { font-weight: 500; color: var(--as-tinta); }

/* El final, abajo, pegado a Progreso: volver es bajar (tocando, empujando para arriba o con la rueda, para abajo). */
.as-final { display: grid; justify-items: center; gap: 6px; margin-top: 30px; }
.as-volver-abajo { appearance: none; cursor: pointer; display: grid; justify-items: center; gap: 2px; padding: 6px 12px; border: 0; background: none; color: var(--as-sub); font: 400 13px/1.2 var(--texto); }
.as-volver-abajo svg { width: 20px; height: 20px; stroke-width: 1.6; animation: as-baja 2.8s ease-in-out infinite; }
@keyframes as-baja { 50% { transform: translateY(3px); opacity: 0.55; } }
.as-pie { margin: 0; font: 400 12px/1.4 var(--texto); color: var(--as-apagado); text-align: center; }

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
  .as-entrada-pista svg, .as-volver-abajo svg, .as-cielo i > svg.entra, .as-polvo-estrella { animation: none; }
  .as-invita.entra, .as-contenido.as-entra, .as-hoja-form.as-entra, .as-parte.as-entra, .as-hoy-titulo.as-cambia, .as-hoy-texto.as-cambia, .as-decide-valor.as-cambia, .as-foco.as-cambia, .as-cuerpo-detalle.as-cambia { animation-duration: 0.01s; }
  .as-chica-orbita, .as-chica-luna, .as-orbita, .as-luna, .as-luna-halo, .as-base > .as-marca, .as-entrada-pista, .as-orbe-arco, .as-orbe-luna, .as-orbe-pista,
  .as-decide-icono, .as-decide-valor, .as-escala-lleno, .as-escala-punto, .as-chip, .as-chip i, .as-m, .as-alcance-ruido, .as-alcance-nivel, .as-barras i,
  .as-siente-escala button, .as-como-cab svg { transition: none; }
}`;

  // El ícono de Ascent (movil/assets/icon.png de su repo), medido: la órbita es 1,5 veces el planeta y los dos
  // tienen el mismo centro; está abierta a la izquierda, de las 8 a las 11 y cuarto; el punto blanco va a las 2
  // menos 20. El planeta es oscuro, con la luz en el borde de arriba a la izquierda (el centro del degradé va
  // abajo a la derecha). Planeta de 25: órbita de 37,5 y punto de 4,7.
  const ORBITA = 'M -14.5 -34.6 A 37.5 37.5 0 1 1 -32.5 18.75';
  const MARCA = `<svg class="as-marca" viewBox="-66 -66 132 132" aria-hidden="true">
    <defs>
      <radialGradient id="asPlaneta" cx="0.62" cy="0.66" r="0.78"><stop offset="0" stop-color="#0b0d12"/><stop offset="0.55" stop-color="#161a23"/><stop offset="0.83" stop-color="#363d4c"/><stop offset="1" stop-color="#9aa3b7"/></radialGradient>
      <linearGradient id="asBorde" x1="0.12" y1="0.08" x2="0.82" y2="0.9"><stop offset="0" stop-color="#e3e9f5" stop-opacity="0.8"/><stop offset="0.45" stop-color="#e3e9f5" stop-opacity="0.14"/><stop offset="1" stop-color="#e3e9f5" stop-opacity="0"/></linearGradient>
      <linearGradient id="asOrbitaGris" gradientUnits="userSpaceOnUse" x1="30" y1="-32" x2="-30" y2="34"><stop offset="0" stop-color="#e6e9ee"/><stop offset="1" stop-color="#868c97"/></linearGradient>
      <radialGradient id="asPunto" cx="0.36" cy="0.32" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#eef0f4"/><stop offset="1" stop-color="#aeb4be"/></radialGradient>
    </defs>
    <circle r="25.6" class="as-marca-brillo" fill="none" stroke="url(#asBorde)" stroke-width="3"/>
    <circle r="25" fill="url(#asPlaneta)" stroke="none"/>
    <circle r="24.6" fill="none" stroke="url(#asBorde)" stroke-width="0.9"/>
    <path class="as-orbita" d="${ORBITA}" stroke="url(#asOrbitaGris)"/>
    <g class="as-luna" transform="translate(28.8 -24)" stroke="none"><circle r="8.5" class="as-luna-halo"/><circle r="4.7" fill="url(#asPunto)"/></g>
  </svg>`;
  // La misma marca en chico (la invitación de Inicio): planeta de 5,2, órbita de 7,8 y punto de 1,55.
  const ORBITA_CHICA = 'M -3.02 -7.19 A 7.8 7.8 0 1 1 -6.75 3.9';
  const MARCA_CHICA = `<svg class="as-marca-chica" viewBox="-12 -12 24 24" aria-hidden="true">
    <defs><radialGradient id="asChicaPlaneta" cx="0.62" cy="0.66" r="0.8"><stop offset="0" stop-color="#10131a"/><stop offset="0.6" stop-color="#1f2430"/><stop offset="0.85" stop-color="#3d4453"/><stop offset="1" stop-color="#97a0b4"/></radialGradient></defs>
    <circle r="5.2" fill="url(#asChicaPlaneta)"/>
    <path class="as-chica-orbita" d="${ORBITA_CHICA}"/>
    <circle class="as-chica-luna" cx="5.99" cy="-4.99" r="1.55"/>
  </svg>`;
  // La entrada de Progreso: el planeta, su órbita completa como pista, el arco de la recuperación y el punto en
  // la punta del arco. Sin vincular, el ícono: la órbita abierta y el punto arriba a la derecha.
  const ORBE = `<svg class="as-orbe" viewBox="-24 -24 48 48" aria-hidden="true">
    <defs>
      <radialGradient id="asOrbePlaneta" cx="0.62" cy="0.66" r="0.8"><stop offset="0" stop-color="#0d1016"/><stop offset="0.58" stop-color="#1b1f2a"/><stop offset="0.85" stop-color="#3b4251"/><stop offset="1" stop-color="#98a1b5"/></radialGradient>
      <radialGradient id="asOrbePunto" cx="0.36" cy="0.32" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9bec8"/></radialGradient>
    </defs>
    <circle class="as-orbe-pista" r="19"/>
    <path class="as-orbe-abierta" d="M -7.36 -17.52 A 19 19 0 1 1 -16.45 9.5"/>
    <circle class="as-orbe-arco" r="19" pathLength="100" transform="rotate(-90)"/>
    <circle r="12.5" fill="url(#asOrbePlaneta)"/>
    <g class="as-orbe-luna"><circle class="as-orbe-halo" r="4.4"/><circle r="2.8" fill="url(#asOrbePunto)"/></g>
  </svg>`;

  // ------------------------------------------------------------ el cuerpo de tu rango
  // Se dibuja la parte de arriba de un círculo de 1.180 px (x de 300 a 760, y hasta unos 260), donde van los
  // detalles; en la sección cuelga del borde de arriba, dado vuelta (.as-cielo). Cada cuerpo con los colores de
  // Ascent (RangoDeAscent y su motor, compartido/motor/cuerpos.ts), simplificado: se ve chico y lejos.
  const LADO = 1180;
  const MEDIO = LADO / 2;
  const limbo = (x) => MEDIO - Math.sqrt(Math.max(0, MEDIO * MEDIO - (x - MEDIO) * (x - MEDIO)));
  // Un azar con semilla: el mismo dibujo cada vez (y en las capturas).
  const azar = (semilla) => () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  /** `n` puntos en la parte que se ve, más juntos cerca del borde si `pegados`. */
  function puntos(n, semilla, pegados = 1.6) {
    const r = azar(semilla);
    return Array.from({ length: n }, () => {
      const x = 300 + r() * 460;
      const y = limbo(x) + 4 + Math.pow(r(), pegados) * 250;
      return { x, y, a: r(), b: r() };
    });
  }
  /** Cráteres: elipses más chatas cuanto más cerca del borde, con la sombra arriba y la luz abajo. */
  function crateres(n, semilla, tam = 1) {
    return puntos(n, semilla, 1.2).map(({ x, y, a, b }) => {
      const rx = (6 + a * 22) * tam;
      const ry = rx * (0.28 + Math.min(1, (y - limbo(x)) / 260) * 0.55);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="rgba(0,0,0,${(0.16 + b * 0.18).toFixed(2)})"/>`
        + `<path d="M ${(x - rx).toFixed(1)} ${y.toFixed(1)} A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 0 ${(x + rx).toFixed(1)} ${y.toFixed(1)}" fill="none" stroke="rgba(255,255,255,${(0.08 + b * 0.1).toFixed(2)})" stroke-width="1.2"/>`;
    }).join('');
  }
  /** Un color mezclado con otro: `f` es cuánto del otro. */
  function mezcla(hex, otro, f) {
    const a = parseInt(hex.slice(1), 16);
    const b = parseInt(otro.slice(1), 16);
    return '#' + [16, 8, 0].map((s) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f).toString(16).padStart(2, '0')).join('');
  }
  /**
   * Una esfera con la luz en el borde de arriba: los colores del más claro al más oscuro, hundidos hacia el fondo
   * de Ascent (`oscuro`) para que el cuerpo quede de fondo y no le gane al texto.
   */
  const base = (id, colores, oscuro = 0.38) => `<radialGradient id="${id}" cx="0.5" cy="0" r="0.24">${colores.map((c, i) => `<stop offset="${(i / (colores.length - 1)).toFixed(2)}" stop-color="${mezcla(c, '#05060a', oscuro)}"/>`).join('')}</radialGradient>`;
  const esfera = (id) => `<circle cx="${MEDIO}" cy="${MEDIO}" r="${MEDIO}" fill="url(#${id})"/>`;
  const PLANETAS_DEL_HORIZONTE = {
    Ceres: { colores: ['#b8c0cc', '#7a828e', '#3c4048', '#0d0e12'], crateres: 26, extra: '<ellipse cx="575" cy="38" rx="7" ry="2.6" fill="#ffffff" opacity="0.9"/><ellipse cx="596" cy="44" rx="3.5" ry="1.4" fill="#ffffff" opacity="0.75"/>' },
    Mercurio: { colores: ['#b5ada4', '#7e766e', '#3a3532', '#0d0c0b'], crateres: 44 },
    Marte: { colores: ['#f0925c', '#d9531e', '#8a2e10', '#2a0e05'], crateres: 10, extra: '<ellipse cx="600" cy="12" rx="70" ry="9" fill="#fff4ea" opacity="0.75"/><ellipse cx="470" cy="120" rx="90" ry="26" fill="#6a2410" opacity="0.4"/><ellipse cx="690" cy="96" rx="70" ry="18" fill="#6a2410" opacity="0.35"/>' },
    Venus: { colores: ['#f0e4c2', '#c9b278', '#8a7a4a', '#2a2416'], crateres: 0, extra: [40, 85, 135, 190].map((y, i) => `<ellipse cx="${560 + i * 18}" cy="${y}" rx="420" ry="${10 + i * 4}" fill="#fff7e0" opacity="${(0.14 - i * 0.025).toFixed(3)}"/>`).join('') },
    Saturno: {
      colores: ['#e8dcbe', '#b0a078', '#6e6248', '#1f1b14'], crateres: 0,
      // Las bandas siguen el borde; los anillos cruzan por delante, con la sombra que dejan arriba.
      extra: [26, 58, 96, 140].map((d, i) => `<circle cx="${MEDIO}" cy="${MEDIO}" r="${MEDIO - d}" fill="none" stroke="${i % 2 ? '#8f8160' : '#d9cba4'}" stroke-width="${12 + i * 4}" opacity="0.28"/>`).join('')
        + '<path d="M -190 205 A 780 92 0 0 0 1370 205" fill="none" stroke="#000" stroke-width="16" opacity="0.28" transform="translate(0 -14)"/>'
        + '<path d="M -190 205 A 780 92 0 0 0 1370 205" fill="none" stroke="#e8dcbe" stroke-width="11" opacity="0.55"/>'
        + '<path d="M -130 205 A 720 80 0 0 0 1310 205" fill="none" stroke="#cbbd96" stroke-width="7" opacity="0.4"/>',
    },
  };
  // ------------------------------------------------------------ el polvo (rango 1): una nebulosa
  // Lo pediste el 5/11/2026: la luna no te gustaba y el polvo estelar de Ascent sí; y que esté arriba, de fondo,
  // como las estrellas, y no como un círculo que sube de abajo. Como en Ascent (crearPolvo en
  // compartido/motor/escena.ts y el modo 5 de shaders.ts), no son puntos sueltos sino gas, con vetas finas (la curva
  // de nivel del ruido), calles oscuras que lo tapan y un adentro cálido con una estrella que nace; encima, granos
  // en grumos y en hebras. A la manera de Moss: una nube más o menos redonda, sin las cortinas de aurora, con sus
  // colores, y los granos derivan despacio.
  const PALETA_DEL_POLVO = ['#1d1436', '#2b3d8c', '#8a6bd6', '#eaa572'];
  const NUBE_MEDIO = { x: NUBE.ancho / 2, y: NUBE.alto / 2 };
  const ESTRELLA_DEL_POLVO = { x: NUBE_MEDIO.x + 14, y: NUBE_MEDIO.y + 6 };
  const LUZ_DEL_POLVO = 1.15;
  const suave = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const aRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const entre = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  /** Ruido de valor con semilla, sumado en octavas: entre 0 y 1, alrededor de 0,5. */
  function ruidoCon(semilla) {
    const r = azar(semilla);
    const T = 256;
    const tabla = Float32Array.from({ length: T * T }, () => r());
    const s = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const en = (i, j) => tabla[(j & (T - 1)) * T + (i & (T - 1))];
    const ruido = (x, y) => {
      const i = Math.floor(x);
      const j = Math.floor(y);
      const u = s(x - i);
      const v = s(y - j);
      const a = en(i, j), b = en(i + 1, j), c = en(i, j + 1), d = en(i + 1, j + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    return (x, y, octavas = 4) => {
      let suma = 0;
      let amp = 0.5;
      let f = 1;
      let total = 0;
      for (let k = 0; k < octavas; k++) {
        suma += ruido(x * f + k * 17.3, y * f - k * 9.1) * amp;
        total += amp;
        amp *= 0.5;
        f *= 2.03;
      }
      return suma / total;
    };
  }
  const formaDeLaNube = ruidoCon(3);
  /** Qué tan afuera está un punto: 1 es el borde, comido por el ruido para que no sea una elipse. */
  const radioDeLaNube = (x, y) => Math.hypot((x - NUBE_MEDIO.x) / NUBE.rx, (y - NUBE_MEDIO.y) / NUBE.ry) * (0.84 + 0.32 * formaDeLaNube(x / 95, y / 95, 3));
  let gasDeLaNube = null;
  /**
   * El gas, pintado una sola vez en un lienzo a dos tercios del tamaño (es suave; los granos, nítidos, van aparte) y
   * puesto como imagen: el ruido por píxel es caro.
   */
  function gasDelPolvo() {
    if (gasDeLaNube) return gasDeLaNube;
    const f = ruidoCon(7);
    const pal = PALETA_DEL_POLVO.map(aRgb);
    const esc = 1.5;
    const w = Math.round(NUBE.ancho / esc);
    const h = Math.round(NUBE.alto / esc);
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const x = (i + 0.5) * esc;
        const y = (j + 0.5) * esc;
        const borde = suave(1, 0.42, radioDeLaNube(x, y));
        if (borde <= 0) continue;
        // El ruido, torcido por otro ruido: así parece gas y no manchas.
        const qx = x / 120;
        const qy = y / 120;
        const wx = f(qx * 1.1 + 3.1, qy * 1.1) * 1.4;
        const wy = f(qx * 1.1, qy * 1.1 + 7.7) * 1.4;
        const base = f(qx * 1.6 + wx, qy * 1.6 + wy);
        const fino = f(qx * 6.5 + wx * 0.6, qy * 6.5 + wy * 0.6, 3);
        const hueco = suave(0.34, 0.52, f(qx * 1.3 + 11, qy * 1.3 + 11, 3));
        const masa = suave(0.36, 0.62, base) * (0.45 + 0.75 * fino) * hueco;
        // Las vetas: un filo fino donde el ruido cruza la mitad. Las calles tapan el gas de atrás.
        const veta = (1 - Math.min(1, Math.abs(f(qx * 2.6 + wx * 0.9, qy * 2.6 + wy * 0.9) - 0.5) / 0.1)) ** 3;
        const calle = suave(0.52, 0.64, f(qx * 3.2 - 7, qy * 3.2 + 3, 3));
        const densidad = (masa * 0.55 + veta * masa * 1.7 + veta * 0.18) * (1 - calle * 0.75);
        const nucleo = suave(1, 0, Math.hypot((x - ESTRELLA_DEL_POLVO.x) / (NUBE.rx * 0.7), (y - ESTRELLA_DEL_POLVO.y) / (NUBE.ry * 0.7)));
        // Del violeta profundo al azul; el lila en los grumos finos y el cálido solo cerca de la estrella.
        let color = entre(pal[0], pal[1], suave(0.38, 0.62, base));
        color = entre(color, pal[2], suave(0.5, 0.72, fino));
        color = entre(color, pal[3], Math.min(1, densidad) ** 2 * nucleo * 0.9);
        const resplandor = nucleo * nucleo * 0.22;
        color = entre(color, entre(pal[2], pal[3], 0.55), Math.min(1, resplandor * 2.5));
        const k = (j * w + i) * 4;
        img.data[k] = Math.min(255, color[0] * LUZ_DEL_POLVO);
        img.data[k + 1] = Math.min(255, color[1] * LUZ_DEL_POLVO);
        img.data[k + 2] = Math.min(255, color[2] * LUZ_DEL_POLVO);
        img.data[k + 3] = Math.round(clamp((densidad * (0.6 + 0.9 * nucleo) + resplandor) * borde * 1.35, 0, 0.95) * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    gasDeLaNube = `<image href="${lienzo.toDataURL()}" x="0" y="0" width="${NUBE.ancho}" height="${NUBE.alto}" preserveAspectRatio="none"/>`;
    return gasDeLaNube;
  }
  let granosDeLaNube = null;
  /** Los granos: en grumos, en hebras que cruzan la nube y sueltos; los grandes, con su halo. */
  function granosDelPolvo() {
    if (granosDeLaNube) return granosDeLaNube;
    const r = azar(41);
    const pal = PALETA_DEL_POLVO.map(aRgb);
    const blanco = aRgb('#eef0ff');
    const rgb = (c) => `rgb(${c.map(Math.round).join(',')})`;
    const distancia = (a, b) => a.reduce((t, v, i) => t + (v - b[i]) ** 2, 0);
    const masParecido = (c) => pal.map((p, i) => [distancia(p, c), i]).sort((a, b) => a[0] - b[0])[0][1];
    const enLaNube = () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 0.9;
      return { x: NUBE_MEDIO.x + Math.cos(a) * d * NUBE.rx, y: NUBE_MEDIO.y + Math.sin(a) * d * NUBE.ry };
    };
    const grumos = Array.from({ length: 6 }, () => ({ ...enLaNube(), rx: 18 + r() * 40, ry: 14 + r() * 28 }));
    const hebras = Array.from({ length: 4 }, () => {
      const o = enLaNube();
      const a = r() * Math.PI;
      const largo = 90 + r() * 160;
      return { x: o.x - (Math.cos(a) * largo) / 2, y: o.y - (Math.sin(a) * largo) / 2, dx: Math.cos(a) * largo, dy: Math.sin(a) * largo, largo };
    });
    let salida = '';
    for (let k = 0; k < 420; k++) {
      let x;
      let y;
      const dado = r();
      if (dado < 0.26) {
        const h = hebras[Math.floor(r() * hebras.length)];
        const t = r();
        const desvio = (r() - 0.5) * 8;
        x = h.x + h.dx * t - (h.dy / h.largo) * desvio;
        y = h.y + h.dy * t + (h.dx / h.largo) * desvio;
      } else if (dado < 0.66) {
        const g = grumos[Math.floor(r() * grumos.length)];
        const a = r() * Math.PI * 2;
        const dd = Math.pow(r(), 0.7);
        x = g.x + Math.cos(a) * dd * g.rx;
        y = g.y + Math.sin(a) * dd * g.ry;
      } else {
        const o = enLaNube();
        x = o.x * 1.1 - NUBE_MEDIO.x * 0.1;
        y = o.y * 1.1 - NUBE_MEDIO.y * 0.1;
      }
      // Más tenues hacia el borde: se pierden en el cielo.
      const dentro = suave(1.15, 0.5, radioDeLaNube(x, y));
      if (dentro <= 0.02 || x < 0 || x > NUBE.ancho || y < 0 || y > NUBE.alto) continue;
      const grande = r() < 0.045;
      const radio = grande ? 1.4 + r() * 1.2 : 0.42 + Math.pow(r(), 2.2) * 1.05;
      const brillo = grande ? 0.85 + r() * 0.15 : 0.2 + Math.pow(r(), 2) * 0.6;
      const t = r();
      const c = t < 0.42 ? entre(pal[1], pal[2], r())
        : t < 0.72 ? entre(pal[2], pal[0], r() * 0.5)
          : t < 0.96 ? entre(pal[3], pal[2], r() * 0.5)
            : entre(blanco, pal[2], 0.3 + r() * 0.3);
      const op = Math.min(1, brillo * dentro * LUZ_DEL_POLVO);
      const cx = x.toFixed(1);
      const cy = y.toFixed(1);
      salida += grande
        ? `<circle cx="${cx}" cy="${cy}" r="${(radio * 4).toFixed(1)}" fill="url(#asGrano${masParecido(c)})" opacity="${(op * 0.5).toFixed(3)}"/><circle cx="${cx}" cy="${cy}" r="${radio.toFixed(2)}" fill="${rgb(entre(c, blanco, 0.35))}" opacity="${op.toFixed(2)}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${radio.toFixed(2)}" fill="${rgb(c)}" opacity="${op.toFixed(2)}"/>`;
    }
    granosDeLaNube = salida;
    return salida;
  }
  /**
   * El polvo: el gas y los granos en dos dibujos (los granos derivan sin repintar el gas) y la estrella que nace, que
   * respira (CSS).
   */
  function nubeDelPolvo() {
    const halos = PALETA_DEL_POLVO.map((h, i) => `<radialGradient id="asGrano${i}"><stop offset="0" stop-color="${h}" stop-opacity="0.9"/><stop offset="0.35" stop-color="${h}" stop-opacity="0.25"/><stop offset="1" stop-color="${h}" stop-opacity="0"/></radialGradient>`).join('');
    return `<svg class="entra" viewBox="0 0 ${NUBE.ancho} ${NUBE.alto}" aria-hidden="true">${gasDelPolvo()}</svg>`
      + `<svg class="entra as-polvo-granos" viewBox="0 0 ${NUBE.ancho} ${NUBE.alto}" aria-hidden="true"><defs>${halos}</defs>${granosDelPolvo()}</svg>`
      + `<b class="as-polvo-estrella" style="left: ${ESTRELLA_DEL_POLVO.x}px; top: ${ESTRELLA_DEL_POLVO.y}px"></b>`;
  }

  /** El horizonte de un rango (RangoDeAscent.cuerpoDeAscent): el cuerpo, sus colores y sus detalles. */
  function cuerpoDelHorizonte(c) {
    const p = c.paleta;
    let defs = '';
    let dentro = '';
    if (c.cuerpo === 'polvo') return nubeDelPolvo();
    if (c.cuerpo === 'galaxia') {
      // Partículas en una banda, con su centro brillante.
      defs = `<radialGradient id="asNube" cx="0.5" cy="0.04" r="0.3"><stop offset="0" stop-color="#e9dcff" stop-opacity="0.55"/><stop offset="0.4" stop-color="${p.principal}" stop-opacity="0.32"/><stop offset="1" stop-color="${p.apagado}" stop-opacity="0"/></radialGradient>`;
      dentro = `<circle cx="${MEDIO}" cy="${MEDIO}" r="${MEDIO}" fill="url(#asNube)"/>`
        + puntos(420, 77, 3.2).map(({ x, y, a, b }) => {
          const color = b < 0.5 ? p.claro : b < 0.8 ? p.principal : '#ffffff';
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + a * 1.5).toFixed(2)}" fill="${color}" opacity="${(0.25 + a * 0.6).toFixed(2)}"/>`;
        }).join('');
    } else if (c.cuerpo === 'agujeroNegro') {
      // Negro absoluto; el naranja, solo en una línea fina pegada al borde (el disco), y el violeta afuera.
      defs = `<radialGradient id="asDisco" cx="0.5" cy="0.5" r="0.5"><stop offset="0.965" stop-color="${p.principal}" stop-opacity="0"/><stop offset="0.992" stop-color="#ffc46b" stop-opacity="0.9"/><stop offset="1" stop-color="${p.principal}" stop-opacity="1"/></radialGradient>`;
      dentro = `<circle cx="${MEDIO}" cy="${MEDIO}" r="${MEDIO}" fill="#020204"/><circle cx="${MEDIO}" cy="${MEDIO}" r="${MEDIO}" fill="url(#asDisco)"/>`;
    } else if (c.cuerpo === 'sol') {
      defs = base('asSol', ['#ffffff', p.claro, p.principal, p.apagado, '#b8650f'], 0.12);
      dentro = esfera('asSol') + puntos(160, 5, 1.1).map(({ x, y, a }) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + a * 6).toFixed(1)}" fill="#fff6d0" opacity="${(0.06 + a * 0.1).toFixed(2)}"/>`).join('');
    } else if (c.cuerpo === 'planeta') {
      const pl = PLANETAS_DEL_HORIZONTE[c.planeta] || PLANETAS_DEL_HORIZONTE.Ceres;
      defs = base('asPlanetaDelDia', pl.colores);
      dentro = esfera('asPlanetaDelDia') + crateres(pl.crateres, 31) + (pl.extra || '');
    } else if (c.cuerpo === 'asteroide') {
      defs = base('asRoca', ['#c9762e', '#95491a', '#5c2a10', '#241408']);
      dentro = esfera('asRoca') + crateres(30, 7, 1.3)
        + puntos(14, 19, 1).map(({ x, y, a }) => `<path d="M ${(x - 40).toFixed(1)} ${y.toFixed(1)} L ${x.toFixed(1)} ${(y - 6 - a * 8).toFixed(1)} L ${(x + 46).toFixed(1)} ${(y + 2).toFixed(1)}" fill="none" stroke="#e08a3c" stroke-width="1.4" opacity="${(0.18 + a * 0.2).toFixed(2)}"/>`).join('');
    } else {
      // La luna: gris mineral, mares oscuros y cráteres.
      defs = base('asLunaDelRango', ['#c9ced8', '#949aa5', '#5c6069', '#24262c', '#0b0c10']);
      dentro = esfera('asLunaDelRango') + '<ellipse cx="455" cy="96" rx="120" ry="30" fill="#3c3f46" opacity="0.45"/><ellipse cx="672" cy="70" rx="80" ry="18" fill="#3c3f46" opacity="0.4"/>' + crateres(34, 3);
    }
    return `<svg class="entra" viewBox="0 0 ${LADO} ${LADO}" aria-hidden="true"><defs>${defs}</defs>${dentro}</svg>`;
  }
  /** Un color #rrggbb a «r, g, b», mezclado con blanco si se pide (el borde del horizonte va más claro). */
  function rgb(hex, conBlanco = 0) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (255 - v) * conBlanco)).join(', ');
  }

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
    const lista =(xs) => (xs.length <= 1 ? xs[0] || '' : `${xs.slice(0, -1).join(', ')} ${tx('ascent.y')} ${xs[xs.length - 1]}`);
    let vinculada = false;
    // Cuánto bajó: 0 es arriba, escondida; 1, abierta.
    let p = 0;
    let abierta = false;
    let animacion = 0;
    // Lo desplegado: «¿Por qué no hay un porcentaje?» y «En qué se basa».
    let queEs = false;
    let como = false;
    // El día de ejemplo que se mira, y si ya se abrió alguna vez (la pista se pliega).
    let diaElegido = 'corta';
    let yaSeAbrio = false;
    let diaDelAnio = null;
    const elDia = () => A.dias[diaElegido];
    // «¿Cómo te sientes para entrenar?», de 0 a 10, en cada día de ejemplo (en la app, lo de esa mañana).
    const siente = {};

    const progresoZona = tel.querySelector('.progreso');
    const pgScroll = progresoZona.querySelector('.pg-scroll');
    const techo = el('div', 'as-techo');
    techo.innerHTML = '<i></i>';
    techo.setAttribute('aria-hidden', 'true');
    const velo = el('div', 'as-velo');
    const zona = el('section', 'ascent pagina-app');
    zona.setAttribute('aria-label', 'Ascent');
    zona.innerHTML = `<div class="as-cielo" aria-hidden="true"><i></i></div><div class="as-scroll"><div class="as-contenido"></div></div>`;
    tel.append(techo, velo, zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cielo = zona.querySelector('.as-cielo');
    const cont = zona.querySelector('.as-scroll');
    const contenido = zona.querySelector('.as-contenido');
    // La marca no se rearma (va con lo principal cada vez que se pinta): así el dibujo cambia con una transición.
    const cajaDeLaMarca = document.createElement('div');
    cajaDeLaMarca.innerHTML = MARCA;
    const marca = cajaDeLaMarca.firstElementChild;
    // Lo principal va siempre en el mismo nodo, con la marca adentro: así la marca cambia con una transición.
    const principal = el('div', 'as-base');
    principal.appendChild(marca);

    // ------------------------------------------------------------ tu rango en Ascent (5/11, para aprobar)
    // La sección toma el color de tu rango y en su cielo está tu cuerpo, como en Ascent, donde cada rango tiñe la
    // app entera. El nombre del rango no se dice: allá «se ve, no se lee». La marca no cambia: es el ícono.
    // Sin vincular, y al abrir la galería, el polvo: el día uno de Ascent (antes, la luna, que no te gustaba).
    let rangoActual = { rango: 1, planeta: null };
    function ponerRango(n, planeta) {
      const c = RangoDeAscent.cuerpoDeAscent(RangoDeAscent.rachaDe(n, planeta || null));
      rangoActual = { rango: c.rango, planeta: c.planeta };
      tel.style.setProperty('--rango-principal', c.paleta.principal);
      tel.style.setProperty('--rango-claro', c.paleta.claro);
      // El borde del cuerpo, más claro que el color del rango; en el agujero negro, el naranja del disco.
      tel.style.setProperty('--rango-borde-rgb', c.cuerpo === 'agujeroNegro' ? rgb(c.paleta.principal) : rgb(c.paleta.claro, 0.35));
      cielo.querySelector('i').innerHTML = cuerpoDelHorizonte(c);
      cielo.classList.toggle('polvo', c.cuerpo === 'polvo');
      cielo.classList.toggle('sin-cuerpo', c.cuerpo === 'galaxia');
      cielo.classList.toggle('brilla', c.cuerpo === 'sol');
      cielo.classList.toggle('negro', c.cuerpo === 'agujeroNegro');
      techo.classList.toggle('polvo', c.cuerpo === 'polvo');
    }
    ponerRango(rangoActual.rango);

    // ------------------------------------------------------------ lo que se calcula
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
    const sesionDeHoy = A.sesiones.find((s) => s.fecha === Datos.HOY);
    const medianoche = sesionDeHoy.inicio - sesionDeHoy.hora * 60e3;
    const DIA = 86_400_000;
    const nombreDeSesion = () => nombreDe(sesionDeHoy.nombre);
    /** El nombre de un ejercicio: el del catálogo de Ascent en el idioma de la galería; un propio, como lo llamó la persona. */
    const nombreDelEjercicio = (e) => (e.id && !e.id.startsWith('propio_') ? tx('ascent.ejercicios.' + e.id) : e.ejercicio);
    const nombreDelMusculo = (m) => tx('ascent.musculos.nombres.' + m);
    /** Las sesiones del día de ejemplo: las de Ascent y, si el día suma alguna (piernas ayer), esa también. */
    const sesionesDe = (d) => (d && d.sesionesExtra ? [...A.sesiones, ...d.sesionesExtra].sort((a, b) => a.inicio - b.inicio) : A.sesiones);
    const previas = (d, en) => sesionesDe(d).filter((x) => x.inicio < en);
    // Entrena hace 6 meses o más (la primera sesión o la marca más vieja de Ascent): el ruido y la recuperación de
    // los entrenados (Conascent.entrenadoSegunAscent en la app).
    const entrenado = (() => {
      const primera = [...A.sesiones.map((s) => s.fecha), ...A.marcas.map((m) => m.fecha)].sort()[0];
      return !!primera && Fechas.diasEntre(primera, Datos.HOY) >= 7 * 26;
    })();
    // El 1RM de cada ejercicio con lo de antes de un momento, una vez por ejercicio: residual() lo pide por serie.
    const memoUnoRM = (d, en) => {
      const vistos = new Map();
      return (b) => {
        const k = b.id || b.ejercicio;
        if (!vistos.has(k)) vistos.set(k, Musculos.mejorE1rm(previas(d, en), b));
        return vistos.get(k);
      };
    };
    /** Antes de entrenar se mira 10 minutos antes de la sesión; ya hecha o sin sesión, ahora. */
    const ahoraDe = (d) => medianoche + (d ? d.ahora : Datos.AHORA_MIN) * 60e3;
    const momentoDe = (d) => (d.sesion === 'prevista' ? sesionDeHoy.inicio - 10 * 60e3 : ahoraDe(d));
    const minutoDe = (t) => Math.round((t - medianoche) / 60e3);
    /**
     * A qué hora ir a la cama esta noche: la del aviso de dormir (Avisos.horasDeSueno), con lo de siempre (en
     * minutos desde las 18 del día anterior, como las noches), la deuda del día de ejemplo y lo que tarda en dormirse.
     */
    const acostarseDe = (d) => {
      const habitual = { dormirse: DORMIR - 18 * 60, despertar: DESPERTAR + 6 * 60 };
      return Avisos.horasDeSueno(Datos.HOY, { habitual: () => habitual, necesidad, deuda: d.deuda, latencia: LATENCIA }).acostarse;
    };
    const nocheDe = (d) => (d.noche ? { dormido: d.noche.dormido, necesidad, despertoAntes: d.noche.despertoAntes } : null);
    /**
     * La última sesión antes de un momento en que trabajaron unos músculos como principales, con las series de
     * trabajo de esos ejercicios (cada serie una vez, aunque trabaje dos de esos músculos).
     */
    function ultimaCon(d, en, musculos, unoRM) {
      for (const s of [...previas(d, en)].reverse()) {
        const series = s.bloques.reduce((t, b) => {
          const m = Musculos.musculosDe(b);
          if (!m || !m.principal.some((x) => musculos.includes(x))) return t;
          const uno = unoRM(b);
          return t + b.series.filter((x) => Musculos.esfuerzoDeSerie(x, uno) > 0).length;
        }, 0);
        if (series > 0) return { sesion: s, series };
      }
      return null;
    }
    /** «hoy», «ayer» o «el lunes» (en la galería, con el día de la semana). */
    function cuandoFue(fecha) {
      const dias = Fechas.diasEntre(fecha, Datos.HOY);
      if (dias === 0) return tx('ascent.recuperado.cuando.hoy');
      if (dias === 1) return tx('ascent.recuperado.cuando.ayer');
      return tx('ascent.recuperado.cuando.dia', { dia: tx('fecha.dias.' + u.partes(fecha).dia) });
    }
    const conMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    /** Lo de hoy: el titular, lo que decide, los músculos de hoy, tu último entreno y la noche. */
    function calcularHoy(d) {
      const en = momentoDe(d);
      const unoRM = memoUnoRM(d, en);
      const opcionesMusc = { unoRM, novato: !entrenado, minuto: minutoDe(en) };
      const sesiones = sesionesDe(d);
      // Lo que entrenas hoy o, sin sesión, lo de los últimos 3 días.
      const musculosHoy = Fatiga.musculosParaLaFatiga({ deHoy: d.sesion ? sesionDeHoy.bloques : null, sesiones, en });
      // Ya hecha, cómo quedaron después de la sesión.
      const despues = d.sesion === 'hecha' ? Fatiga.fatigaMuscular(Object.assign({ musculos: musculosHoy, sesiones, en: ahoraDe(d) }, opcionesMusc, { minuto: minutoDe(ahoraDe(d)) })) : null;
      const f = Fatiga.fatigaMuscular(Object.assign({ musculos: musculosHoy, sesiones, en }, opcionesMusc));
      const titular = Recuperado.titularDeHoy({
        sesion: d.sesion, sabeCuandoEntrena: true, noche: nocheDe(d), ultimas3: d.ultimas3, musculos: d.sesion === 'prevista' ? f.peor : null,
        comoTeSientes: siente[diaElegido] ?? null,
      });
      // El último entreno: el de hoy si ya está hecho; si no, el último antes.
      const ultima = d.sesion === 'hecha' ? sesionDeHoy : previas(d, en).pop() || null;
      const trabajados = ultima ? Musculos.musculosTrabajados(ultima, unoRM) : [];
      const conEllos = musculosHoy.length ? ultimaCon(d, en, musculosHoy, unoRM) : null;
      const noche = nocheDe(d);
      return {
        en, titular, f, despues, musculosHoy, ultima, trabajados, conEllos,
        noche: noche ? { ...noche, estado: Rendimiento.estadoDeLaNoche(noche), seguidas: Rendimiento.nochesCortasSeguidas(d.ultimas3), calidad: d.noche.calidad } : null,
      };
    }

    /** Lo de Moss de un día pasado: lo comido (con días offset desde hoy). */
    const comidoEl = (fecha) => opciones.comida.totalDe(Fechas.diasEntre(Datos.HOY, fecha));
    const pesoDeHoy = () => Datos.PESADAS[Datos.PESADAS.length - 1].kg;

    /** La comida de la semana: la proteína por kilo de los días anotados y la de ayer. */
    function calcularComida() {
      const dias = Array.from({ length: 7 }, (_, i) => Fechas.sumarDias(Datos.HOY, -1 - i)).map(comidoEl).filter((t) => t.kcal > 0);
      const meta = opciones.metaBase();
      const ayer = comidoEl(Fechas.sumarDias(Datos.HOY, -1));
      return {
        dias: dias.length,
        gPorKg: dias.length >= 3 ? dias.reduce((s, t) => s + t.p, 0) / dias.length / pesoDeHoy() : null,
        ayer: ayer.kcal > 0 ? { p: Math.round(ayer.p), meta: meta.proteina } : null,
      };
    }

    /** Los ejercicios que se siguen en «Tu fuerza»: los multiarticulares de la rutina con marca en Ascent, desde hoy en la semana. */
    function ejerciciosDeLaFuerza() {
      const hoy = Fechas.diaDeLaSemana(Datos.HOY);
      const conMarca = new Set(A.marcas.map((m) => m.id));
      const vistos = new Set();
      const lista = [];
      [...A.rutina].sort((a, b) => ((a.dia - hoy + 7) % 7) - ((b.dia - hoy + 7) % 7)).forEach((dia) => dia.ejercicios.forEach((e) => {
        const c = Musculos.CATALOGO[e.id];
        if (!c || !c.multiarticular || !conMarca.has(e.id) || vistos.has(e.id)) return;
        vistos.add(e.id);
        lista.push(e);
      }));
      return lista;
    }

    /** La tendencia de un ejercicio con lo de antes de hoy (ya hecha, con la de hoy). */
    function tendenciaDe(e, d) {
      const hasta = d.sesion === 'hecha' ? Fechas.sumarDias(Datos.HOY, 1) : Datos.HOY;
      const sesiones = sesionesDe(d).filter((s) => s.fecha < hasta);
      const puntos = Estancados.puntosDelEjercicio(sesiones, e, Datos.HOY);
      return { t: Rendimiento.tendenciaDeFuerza(puntos, { hoy: 0, entrenado }), puntos };
    }
    const marcasDe = (id) => A.marcas.filter((m) => m.id === id);
    const unRmDe = (m) => Musculos.unRmDeAscent({ kilos: m.peso, reps: m.reps });
    const mejorMarca = (id) => marcasDe(id).reduce((a, m) => (!a || unRmDe(m) > unRmDe(a) ? m : a), null);
    const ultimaMarca = (id) => marcasDe(id).reduce((a, m) => (!a || m.fecha > a.fecha ? m : a), null);

    /** Las series duras de unos músculos (como principales) entre dos momentos. */
    function seriesDe(d, musculos, desde, hasta, unoRM) {
      return sesionesDe(d).filter((x) => x.inicio >= desde && x.inicio < hasta).reduce((t, x) => {
        const dosis = Musculos.dosisDeLaSesion(x, unoRM);
        return t + musculos.reduce((s, m) => s + ((dosis.get(m) && dosis.get(m).series) || 0), 0);
      }, 0);
    }

    /** Los ejercicios de la sesión de hoy con marca: qué tan cerca estás, lo que acompaña y cada cuánto haces marca. */
    function calcularMarcas(d, k) {
      const en = k.en;
      const unoRM = memoUnoRM(d, en);
      const lista = [];
      sesionDeHoy.bloques.forEach((bloque) => {
        const pr = mejorMarca(bloque.id);
        if (!pr) return;
        const { t } = tendenciaDe(bloque, d);
        const musc = Musculos.musculosDe(bloque);
        const peor = Musculos.peorEstado(musc.principal.map((m) => Musculos.estadoDe(Musculos.residual(m, previas(d, en), en, { unoRM, novato: !entrenado }))));
        const semana = seriesDe(d, musc.principal, en - 7 * DIA, en, unoRM);
        const mes = seriesDe(d, musc.principal, en - 35 * DIA, en - 7 * DIA, unoRM) / 4;
        const cerca = Rendimiento.cercaDeLaMarca({ marca: unRmDe(pr), nivel: t.nivel, sigma: t.sigma });
        const condiciones = Rendimiento.condicionesDeLaMarca({ noche: nocheDe(d), ultimas3: d.ultimas3, musculos: peor, seriesSemanaSobreMes: mes ? semana / mes : null });
        const fechas = sesionesDe(d).filter((s) => s.fecha < Datos.HOY && s.bloques.some((b) => b.id === bloque.id)).map((s) => s.fecha);
        const frecuencia = Rendimiento.frecuenciaDeMarcas(fechas, marcasDe(bloque.id).map((m) => m.fecha));
        lista.push({ bloque, pr, t, cerca, condiciones, frecuencia });
      });
      return Diagnostico.ordenarMarcas(lista);
    }

    /** Lo comido y dormido de la semana que empieza un lunes, para las razones (solo los días que ya pasaron). */
    function mossDeLaSemana(lunes) {
      const fechas = Array.from({ length: 7 }, (_, i) => Fechas.sumarDias(lunes, i)).filter((f) => f < Datos.HOY);
      const comidos = fechas.map(comidoEl).filter((t) => t.kcal > 0);
      const noches = Datos.NOCHES.filter((x) => fechas.includes(x.clave)).map((x) => x.dormido);
      return { comida: { dias: comidos.length, proteina: comidos.length ? comidos.reduce((s, t) => s + t.p, 0) / comidos.length : 0 }, noches };
    }
    const promedioDe = (xs) => (xs.length >= 3 ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    const ANIOS = { principiante: 0, intermedio: 2, avanzado: 4 };

    /** Los ejercicios estancados de «Tu fuerza», con sus razones. */
    function calcularEstancados(d, fuerza) {
      const persona = opciones.persona();
      const sesiones = sesionesDe(d).filter((s) => s.fecha < Datos.HOY);
      const conSesion = (lunes) => sesiones.some((s) => s.fecha >= lunes && s.fecha < Fechas.sumarDias(lunes, 7));
      const baja = persona.cambio7 !== null && persona.cambio7 !== undefined ? (-persona.cambio7 / pesoDeHoy()) * 100 : null;
      return fuerza.flatMap(({ e, t }) => {
        const ultima = ultimaMarca(e.id);
        const sinMarca = ultima ? Math.floor(Fechas.diasEntre(ultima.fecha, Datos.HOY) / 7) : 0;
        if (!Estancados.estaEstancado(t, sinMarca, A.umbral)) return [];
        const musculo = Musculos.musculosDe(e).principal[0];
        // Las semanas sin ninguna sesión (las vacaciones) no cuentan para comparar lo que se entrenaba.
        const s = Estancados.semanasParaLasRazones(ultima.fecha, Datos.HOY);
        const semana = (l) => Estancados.semanaDeEntreno(sesiones, l, e, musculo);
        const antes = s.antes.filter(conSesion).map(semana);
        const ahora = s.ahora.filter(conSesion).map(semana);
        const moss = s.ahora.map(mossDeLaSemana);
        const nochesAntes = s.antes.flatMap((l) => mossDeLaSemana(l).noches);
        const r = Estancados.razonesDeEstancamiento({
          antes, ahora, objetivo: persona.perfil.objetivo, sinDeficit: sinDeficit(), bajaSemanal: baja,
          // «Juntando información» (el panel de la galería): todavía sin semanas de comida completas.
          comida: opciones.pocasSemanas() ? moss.map((x) => ({ dias: Math.min(2, x.comida.dias), proteina: x.comida.proteina })) : moss.map((x) => x.comida),
          pesoKg: pesoDeHoy(),
          sueno: { antes: promedioDe(nochesAntes), ahora: opciones.pocasSemanas() ? null : promedioDe(moss.flatMap((x) => x.noches)) },
          anios: ANIOS[Datos.PERFIL.experiencia] ?? null,
        });
        return [{ e, t, ultima, sinMarca, musculo, antes, ahora, r }];
      });
    }

    /** Lo de hoy para «Hoy, concéntrate en»: la meta del día, con o sin la sesión anotada. */
    function entradasDelDia(d, marcaDeHoy) {
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
          comidasHabituales: 4, pesoKg: pesoDeHoy(), edad: Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento,
          // El corte del café cuenta desde la hora de ir a la cama de esta noche (alrededorDelEntreno.ts), no desde la de dormirse.
          despertar: DESPERTAR, dormir: DORMIR, acostarse: acostarseDe(d), cafeinaPorToma: d.cafe || null, sinDeficit: sinDeficit(),
        },
        sesion, sabeCuandoEntrena: true,
        noche: d.noche ? { dormido: d.noche.dormido, necesidad, siesta: d.noche.siesta, despertoAntes: d.noche.despertoAntes } : null,
        ultimas3: d.ultimas3, deuda: d.deuda, marca: marcaDeHoy,
      };
    }

    /** Todo lo del día de ejemplo, una vez por pintada. */
    function calcularDia(d) {
      const k = calcularHoy(d);
      const fuerza = ejerciciosDeLaFuerza().map((e) => Object.assign({ e }, tendenciaDe(e, d)));
      const marcas = d.sesion === 'prevista' ? calcularMarcas(d, k) : [];
      const buena = d.noche ? marcas.find((m) => Diagnostico.buenDiaParaLaMarca(m)) : null;
      const x = entradasDelDia(d, buena ? enFrase(nombreDelEjercicio(buena.bloque)) : null);
      const diag = Diagnostico.diagnostico(x);
      const foco = Diagnostico.focoDeHoy(Object.assign({}, x, { titular: d.noche ? k.titular : null, acostarse: acostarseDe(d) }));
      const ahora = ahoraDe(d);
      const unoRM = memoUnoRM(d, ahora);
      const opcionesAhora = { unoRM, novato: !entrenado, minuto: minutoDe(ahora) };
      return Object.assign(k, {
        fuerza, marcas, diag, foco, comida: calcularComida(),
        todos: Fatiga.todosLosMusculos(Object.assign({ sesiones: sesionesDe(d), en: ahora }, opcionesAhora)),
        rutina: Fatiga.fatigaPorDia(Object.assign({
          rutina: A.rutina.map((r) => ({ dia: r.dia, nombre: nombreDe(r.nombre), ejercicios: r.ejercicios })),
          hoy: Fechas.diaDeLaSemana(Datos.HOY), sesiones: sesionesDe(d), en: ahora,
        }, opcionesAhora)),
        estancados: calcularEstancados(d, fuerza),
      });
    }

    // ------------------------------------------------------------ lo de antes, para Sueño (hasta que se decida)
    // Sueño todavía muestra «Estás 87 % recuperado» y el rendimiento esperado (galeria/src/sueno.js): se calculan
    // como antes, con la persona de mentira y la comida sin anotar fuera de la cuenta.
    function recuperadoDeAntes() {
      const anoche = opciones.anoche();
      if (!anoche) return null;
      const en = sesionDeHoy.inicio - 10 * 60e3;
      const unoRM = memoUnoRM(null, en);
      const musculos = Fatiga.musculosParaLaFatiga({ deHoy: sesionDeHoy.bloques, sesiones: A.sesiones, en });
      const f = Fatiga.fatigaMuscular({ musculos, sesiones: A.sesiones, en, unoRM, novato: !entrenado });
      const meta = opciones.metaBase();
      const ayer = opciones.comida.totalDe(-1);
      return Recuperado.recuperado({
        dormido: anoche.dormido, necesidad, calidad: anoche.calidad ?? null, sentida: opciones.cara(Datos.HOY), fatiga: f.indice,
        proteinaAyer: ayer.kcal > 0 ? ayer.p : null, metaProteina: meta.proteina, kcalAyer: ayer.kcal > 0 ? ayer.kcal : null, metaKcal: meta.kcal,
      });
    }
    function rendimientoDeAntes() {
      const noches = opciones.noches();
      const anoche = noches.find((n) => n.clave === Datos.HOY) || null;
      const habitual = SinReloj.habitualDe(noches, Datos.HOY);
      const deuda = Sueno.deudaDeSueno(Sueno.ultimasNoches(noches, Datos.HOY, 14), necesidad);
      const en = sesionDeHoy.inicio - 10 * 60e3;
      const unoRM = memoUnoRM(null, en);
      const musc = Musculos.musculosDe(sesionDeHoy.bloques[0]);
      return Rendimiento.rendimientoEsperado({
        sueno: anoche ? {
          dormido: anoche.dormido, necesidad, despertoAntes: !!habitual && anoche.despertar < habitual.despertar - 60,
          seAcostoTarde: !!habitual && anoche.dormirse > habitual.dormirse + 60, siesta: anoche.siestas >= 20, sinReloj: !!anoche.moss,
        } : null,
        ultimas3: [0, 1, 2].map((k) => noches.find((n) => n.clave === Fechas.sumarDias(Datos.HOY, -k))).filter(Boolean).map((n) => n.dormido),
        deuda: deuda ? deuda.minutos : null, cara: opciones.cara(Datos.HOY), multiarticular: musc.multiarticular,
        tren: musc.principal.some((m) => Musculos.DE_PIERNAS.includes(m)) ? 'inferior' : 'superior', horaHabitual: sesionDeHoy.hora,
        comida: { ayuno8h: false, sesionLarga: sesionDeHoy.minutos > 45, carbosAyerPorKilo: null, mismosMusculosAyer: false, bajaSemanal: null, semanasBajando: 0, kcalAyer: null },
        residual: Math.max(...musc.principal.map((m) => Musculos.residual(m, previas(null, en), en, { unoRM, novato: !entrenado }))),
        descarga: { diasSinSeriesDuras: 7, seriesSemanaSobreMes: null, intensidadMantenida: false, diasSinElEjercicio: 7 },
        entrenado,
      });
    }
    /** El titular de hoy con la persona de mentira, en dos líneas, para quien lo quiera mostrar (Sueño, cuando se apruebe). */
    function titularParaAfuera() {
      const anoche = opciones.anoche();
      const d = Object.assign({}, A.dias.bien, {
        noche: anoche ? { dormido: anoche.dormido, calidad: anoche.calidad ?? null, despertoAntes: null, siesta: false } : null,
        ultimas3: [0, 1, 2].map((k) => opciones.noches().find((n) => n.clave === Fechas.sumarDias(Datos.HOY, -k))).filter(Boolean).map((n) => n.dormido),
        ahora: Datos.AHORA_MIN, sesion: Datos.AHORA_MIN < sesionDeHoy.hora ? 'prevista' : 'hecha',
      });
      const k = calcularHoy(d);
      const [titulo, texto] = textosDelTitular(d, k);
      return { que: k.titular.que, limita: k.titular.limita, titulo, texto };
    }

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
    // Los días sin la calidad del sueño y con las piernas cargadas se suman acá al panel, junto a los otros.
    const segmentoDelDia = document.getElementById('s-dia-ascent');
    [['cargado', 'Piernas cargadas (entrenó ayer)'], ['sinCalidad', 'Sin la calidad del sueño']].forEach(([valor, texto]) => {
      if (!segmentoDelDia || segmentoDelDia.querySelector(`[data-valor="${valor}"]`)) return;
      const b = document.createElement('button');
      Object.assign(b, { type: 'button', textContent: texto });
      b.dataset.valor = valor;
      b.setAttribute('aria-pressed', 'false');
      segmentoDelDia.appendChild(b);
    });
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
    // transición y el texto cambia con un fundido. Vinculada, la órbita se cierra (las dos apps, juntas) y lo
    // de hoy va en dos palabras, sin porcentaje; si algo pone el límite hoy, la órbita va en terracota.
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
      const k = vinculada ? calcularHoy(d) : null;
      const instalada = esteIphone !== 'sinAscent';
      let cifra;
      let sub = '';
      if (!vinculada) cifra = tx(instalada ? 'ascent.senal.vincular' : 'ascent.senal.marca');
      else {
        cifra = tx('ascent.entrada.titular.' + k.titular.que);
        sub = !d.sesion ? tx('ascent.entrada.descanso') : d.sesion === 'hecha' ? tx('ascent.senal.hoy', { sesion: enFrase(nombreDeSesion()) }) : tx('ascent.entrada.sesion', { sesion: nombreDeSesion(), hora: u.horaMin(sesionDeHoy.hora) });
      }
      entrada.classList.toggle('sin', !vinculada);
      entrada.classList.toggle('vinculo', vinculada);
      entrada.classList.toggle('atencion', !!k && !!k.titular.limita);
      entrada.style.setProperty('--arco', vinculada ? '100' : '0');
      entrada.style.setProperty('--giro', '50.2deg');
      entradaPista.textContent = tx('ascent.entrada.pista');
      entrada.setAttribute('aria-label', vinculada ? tx('ascent.entrada.etiquetaTitular', { titular: cifra }) : tx('ascent.flecha'));
      const firma = `${cifra}|${sub}`;
      if (firma === firmaDeLaEntrada) return;
      const habia = firmaDeLaEntrada !== '';
      firmaDeLaEntrada = firma;
      entradaCifra.textContent = cifra;
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
    // Solo con Ascent en este iPhone y sin vincular; «Ahora no» la guarda 4 horas (en la galería, el botón
    // «Pasaron 4 horas» la trae de vuelta). «Vincular» abre la hoja: dos toques.
    let descartada = false;
    let invitacionVista = false;
    // La que se está yendo sigue en su lugar: Inicio se vuelve a pintar entero en cualquier momento.
    let saliendo = null;
    function invitacion() {
      if (saliendo) return saliendo;
      const invita = SenalDeAscent.invitarEnInicio({ conAscent: !opciones.prendida || opciones.prendida(), listo: true, conCuenta: esteIphone !== 'sinCuenta', vinculada, instalada: esteIphone !== 'sinAscent', descartada, ahora: Date.now() });
      if (!invita) { invitacionVista = false; return null; }
      const c = el('article', 'as-invita' + (invitacionVista ? '' : ' entra'));
      invitacionVista = true;
      c.innerHTML = MARCA_CHICA;
      const textos = el('div');
      textos.append(el('b', 'as-invita-titulo', tx('ascent.invitacion.titulo')), el('p', 'as-invita-texto', tx('ascent.invitacion.texto')));
      const acciones = el('div', 'as-invita-acciones');
      acciones.append(
        boton('as-invita-si', tx('ascent.invitacion.vincular'), () => abrirVincular()),
        boton('as-invita-no', tx('ascent.invitacion.ahoraNo'), () => { descartada = Date.now(); quitarInvitacion(); }),
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
    const consejo = (texto) => el('p', 'as-fila-consejo', texto);
    const aLaCama = (d) => u.horaMin(acostarseDe(d));
    const cuandoDe = (c) => tx('ascent.titular.cuando.' + c);
    /** Lo que cambia de texto entra con un fundido: nada aparece de golpe. */
    function cambiar(n, texto) {
      if (n.textContent === texto) return;
      n.textContent = texto;
      n.classList.remove('as-cambia');
      void n.offsetWidth;
      n.classList.add('as-cambia');
    }

    /**
     * Una escala en una línea, de 0 a `tope`: lo de hoy hasta su punto, y las rayas de los umbrales con su
     * nombre. `zona` sombrea de 0 a ese valor (lo que se considera poco).
     */
    function escala(valor, tope, rayas, { limita = false, zona = null, etiqueta = '' } = {}) {
      const c = el('div', 'as-escala' + (limita ? ' limita' : ''));
      const x = (v) => `${((clamp(v, 0, tope) / tope) * 100).toFixed(2)}%`;
      if (zona !== null) {
        const z = el('i', 'as-escala-zona');
        z.style.left = '0';
        z.style.width = x(zona);
        c.appendChild(z);
      }
      c.appendChild(el('i', 'as-escala-pista'));
      rayas.forEach(([v, texto]) => {
        const r = el('i', 'as-escala-raya');
        r.style.left = x(v);
        if (texto) r.appendChild(el('span', null, texto));
        c.appendChild(r);
      });
      if (valor !== null) {
        const lleno = el('i', 'as-escala-lleno');
        lleno.style.width = x(valor);
        const punto = el('i', 'as-escala-punto');
        punto.style.left = x(valor);
        c.append(lleno, punto);
      }
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', etiqueta);
      return c;
    }

    // ------------------------------------------------------------ el cuerpo dibujado
    // De frente y de espalda (cada figura de 100 × 190; la de espalda, corrida 110): cada músculo es una o dos
    // formas con su clase. Lo que no es músculo va apenas, para que se lea un cuerpo.
    const LADOS = (izq, der) => [izq, der];
    const BRAZO = (cy, rx, ry, x, giro) => LADOS(`<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${giro} ${x} ${cy})"/>`, `<ellipse cx="${100 - x}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${-giro} ${100 - x} ${cy})"/>`);
    const PIERNA = (cy, rx, ry, x, giro = 0) => LADOS(`<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${giro} ${x} ${cy})"/>`, `<ellipse cx="${100 - x}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${-giro} ${100 - x} ${cy})"/>`);
    const FORMAS = {
      frente: {
        hombros: BRAZO(40, 7.4, 5.8, 32, -24),
        pecho: LADOS('<path d="M50 35 C44 33.5 38 35 36.2 40 C35.2 46 39 51 45 51 C48 51 50 49.6 50 47 Z"/>', '<path d="M50 35 C56 33.5 62 35 63.8 40 C64.8 46 61 51 55 51 C52 51 50 49.6 50 47 Z"/>'),
        biceps: BRAZO(58, 4.3, 9.6, 28.6, 10),
        antebrazos: BRAZO(81, 3.6, 10.6, 24, 12),
        abdomen: ['<rect x="43.6" y="53" width="12.8" height="31" rx="5"/>'],
        aductores: PIERNA(104, 2.6, 9, 46.6),
        cuadriceps: PIERNA(117, 6.6, 19, 41, 4),
        pantorrillas: PIERNA(160, 4.2, 13.5, 41.5),
      },
      espalda: {
        espaldaAlta: ['<path d="M36 34 Q50 30 64 34 L62.4 48 Q58 60 50 63 Q42 60 37.6 48 Z"/>'],
        hombros: BRAZO(40, 7.4, 5.8, 32, -24),
        triceps: BRAZO(58, 4.3, 9.6, 28.6, 10),
        antebrazos: BRAZO(81, 3.6, 10.6, 24, 12),
        espaldaBaja: ['<rect x="43" y="64" width="14" height="17" rx="4.5"/>'],
        gluteos: PIERNA(91, 6.8, 7.6, 44),
        isquios: PIERNA(119, 6.1, 17, 42, 3),
        pantorrillas: PIERNA(157, 4.8, 12.5, 42),
      },
    };
    /** Una curva suave y cerrada que pasa por unos puntos (Catmull-Rom llevada a Bézier). */
    function suave(pts) {
      const n = pts.length;
      const p = (i) => pts[(i + n) % n];
      let d = `M${p(0)[0]} ${p(0)[1]}`;
      for (let i = 0; i < n; i++) {
        const [a, b, c, e] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
        d += ` C${(b[0] + (c[0] - a[0]) / 6).toFixed(1)} ${(b[1] + (c[1] - a[1]) / 6).toFixed(1)} ${(c[0] - (e[0] - b[0]) / 6).toFixed(1)} ${(c[1] - (e[1] - b[1]) / 6).toFixed(1)} ${c[0]} ${c[1]}`;
      }
      return d + 'Z';
    }
    // La silueta: la mitad izquierda, del cuello al tiro, y la derecha en espejo.
    const MITAD = [
      [45.5, 24], [44.5, 30], [38, 33], [31, 35.5], [27, 39], [25, 46], [24, 56], [22.5, 66], [20.5, 77], [19, 87], [18.5, 93], [19.5, 99], [22.5, 100], [24, 95],
      [25.5, 86], [27.5, 75], [29.5, 64], [32, 55], [33, 62], [34.5, 72], [34, 84], [33.5, 94], [35, 108], [36.5, 124], [37.5, 138], [36.5, 150], [37.5, 162],
      [39, 172], [37, 177], [40, 180], [45.5, 179.5], [45.5, 172], [46.5, 160], [47, 148], [47, 138], [48, 124], [49, 110], [50, 101],
    ];
    const SILUETA = suave([...MITAD, ...MITAD.slice(0, -1).reverse().map(([x, y]) => [100 - x, y])]);
    const BASE = `<circle cx="50" cy="15" r="8.5"/><path d="${SILUETA}"/>`;
    /**
     * El cuerpo, con la clase de cada músculo (`clases[musculo]`: '', 'recuperandose', 'cargado' o 'trabajado').
     * Con `rotulos`, «De frente» y «De espalda» debajo.
     */
    function cuerpo(clases, { rotulos = false, etiqueta = '' } = {}) {
      const figura = (lado, dx) => {
        const formas = Object.entries(FORMAS[lado]).map(([m, xs]) => xs.map((f) => f.replace(/^<(\w+)/, `<$1 class="as-m ${clases[m] || ''}" data-musculo="${m}"`)).join('')).join('');
        return `<g transform="translate(${dx} 0)"><g class="as-cuerpo-base">${BASE}</g>${formas}${rotulos ? `<text class="as-cuerpo-rotulo" x="50" y="194">${tx('ascent.cuerpo.' + lado)}</text>` : ''}</g>`;
      };
      return `<svg class="as-cuerpo-svg" viewBox="0 0 210 ${rotulos ? 198 : 184}" role="img" aria-label="${etiqueta}">${figura('frente', 0)}${figura('espalda', 110)}</svg>`;
    }

    // ------------------------------------------------------------ el titular del día
    /** Los nombres de unos músculos en una lista: «cuádriceps y glúteos». */
    const listaDeMusculos = (ms) => lista(ms.map((m) => nombreDelMusculo(m).toLowerCase()));
    /** Cuándo van a estar listos unos músculos: el más lento de todos. */
    function cuandoTodos(musculos) {
      const orden = ['ya', 'hoy', 'manana', 'pasadoManana', 'enUnosDias'];
      return musculos.reduce((a, m) => (orden.indexOf(m.cuando) > orden.indexOf(a) ? m.cuando : a), 'ya');
    }
    /** El titular y su línea, según el caso. */
    function textosDelTitular(d, k) {
      const t = k.titular.que;
      const musculos = listaDeMusculos(k.musculosHoy);
      const sesion = enFrase(nombreDeSesion());
      if (t === 'hecha') {
        const cuando = cuandoTodos(k.despues ? k.despues.musculos : []);
        return [tx('ascent.titular.hecha.titulo', { sesion }), cuando === 'ya' ? tx('ascent.titular.hecha.yaListos') : tx('ascent.titular.hecha.texto', { musculos, cuando: cuandoDe(cuando) })];
      }
      if (t === 'descanso' || t === 'sinHorario') {
        const falta = k.f.musculos.filter((m) => m.estado !== 'recuperado').sort((a, b) => b.residual - a.residual)[0];
        return [tx('ascent.titular.' + t + '.titulo'), falta ? tx('ascent.titular.descanso.texto', { musculo: nombreDelMusculo(falta.musculo).toLowerCase(), cuando: cuandoDe(falta.cuando) }) : tx('ascent.titular.descanso.listos')];
      }
      if (t === 'faltaNoche') return [tx('ascent.titular.faltaNoche.titulo'), tx('ascent.titular.faltaNoche.texto', { sesion })];
      // Cargado o recuperándose: se nombra lo que todavía no está, no todo lo de hoy.
      const faltan = k.f.musculos.filter((m) => m.estado !== 'recuperado');
      const deFaltan = faltan.length ? listaDeMusculos(faltan.map((m) => m.musculo)) : musculos;
      if (t === 'cargado') return [tx('ascent.titular.cargado.titulo'), tx('ascent.titular.cargado.texto', { musculos: deFaltan, cuando: cuandoDe(cuandoTodos(faltan)) })];
      if (t === 'suenoCorto') {
        const porque = k.noche.estado === 'corta' || k.noche.estado === 'muyCorta' ? ((k.noche.despertoAntes ?? 0) >= 60 && k.noche.dormido > 360 ? 'temprano' : 'poco') : 'seguidas';
        return [tx('ascent.titular.suenoCorto.titulo'), tx('ascent.titular.suenoCorto.' + porque)];
      }
      if (t === 'teSientes') return [tx('ascent.titular.teSientes.titulo'), tx('ascent.titular.teSientes.texto')];
      if (t === 'casi') return [tx('ascent.titular.casi.titulo'), tx('ascent.titular.casi.texto', { musculos: deFaltan, cuando: cuandoDe(cuandoTodos(faltan)) })];
      return [tx('ascent.titular.listo.titulo', { sesion }), tx('ascent.titular.listo.texto')];
    }

    /** Lo que decide hoy, en tres: la noche, lo que entrenas y cómo te sientes. */
    function decide(d, k) {
      const ul = el('ul', 'as-decide');
      const item = (clase, icon, nombre, valor, limita) => {
        const li = el('li', clase + (limita ? ' limita' : ''));
        const i = el('span', 'as-decide-icono');
        i.innerHTML = icono(icon);
        li.append(i, el('span', 'as-decide-nombre', nombre), el('span', 'as-decide-valor', valor));
        return li;
      };
      const n = k.noche;
      const noche = !n ? tx('ascent.decide.sinNoche') : n.seguidas && n.estado !== 'corta' && n.estado !== 'muyCorta' ? tx('ascent.noche.seguidas') : tx('ascent.noche.' + n.estado);
      const s = siente[diaElegido];
      ul.append(
        item('noche', 'sueno', tx('ascent.decide.noche'), noche, k.titular.limita === 'sueno'),
        item('musculos', 'pesa', tx('ascent.decide.musculos'), k.f.peor ? tx('ascent.decide.estados.' + k.f.peor) : '—', k.titular.limita === 'musculos'),
        item('siente', 'corazon', tx('ascent.decide.siente'), s === undefined ? '—' : tx('ascent.siente.respuesta', { n: s }), k.titular.limita === 'teSientes'),
      );
      return ul;
    }

    /** «¿Cómo te sientes para entrenar?», de 0 a 10: cambia el titular al tocar, sin volver a pintar todo. */
    function sienteHoy(d) {
      const c = el('div', 'as-siente');
      c.appendChild(linea('as-siente-pregunta', tx('ascent.siente.pregunta')));
      const escala2 = el('div', 'as-siente-escala');
      escala2.setAttribute('role', 'group');
      escala2.setAttribute('aria-label', tx('ascent.siente.pregunta'));
      for (let n = 0; n <= 10; n++) {
        const b = boton(null, String(n), () => {
          siente[diaElegido] = siente[diaElegido] === n ? undefined : n;
          escala2.querySelectorAll('button').forEach((x, i) => x.setAttribute('aria-pressed', String(i === siente[diaElegido])));
          repintarElTitular(d);
        });
        b.setAttribute('aria-pressed', String(siente[diaElegido] === n));
        escala2.appendChild(b);
      }
      const extremos = el('div', 'as-siente-extremos');
      extremos.append(el('span', null, tx('ascent.siente.poco')), el('span', null, tx('ascent.siente.mucho')));
      c.append(escala2, extremos);
      return c;
    }
    /** Lo que cambia con «¿Cómo te sientes?»: el titular, lo que decide, cómo ir en el gimnasio y la entrada, con un fundido. */
    function repintarElTitular(d) {
      const k = calcularDia(d);
      const [titulo, texto] = textosDelTitular(d, k);
      const cab = contenido.querySelector('.as-hoy');
      if (!cab) return;
      cambiar(cab.querySelector('.as-hoy-titulo'), titulo);
      cambiar(cab.querySelector('.as-hoy-texto'), texto);
      const viejo = cab.querySelector('.as-decide');
      if (viejo) {
        const nuevo = decide(d, k);
        viejo.querySelectorAll('li').forEach((li, i) => {
          const otro = nuevo.children[i];
          li.className = otro.className;
          cambiar(li.querySelector('.as-decide-valor'), otro.querySelector('.as-decide-valor').textContent);
        });
      }
      // «Hoy, concéntrate en» también cambia (escúchate en vez de la marca): entra de nuevo, sin saltar.
      const focoViejo = contenido.querySelector('.as-foco');
      const focoNuevo = parteFoco(d, k);
      if (focoViejo && focoNuevo && focoViejo.textContent !== focoNuevo.textContent) {
        focoNuevo.classList.add('as-cambia');
        focoViejo.replaceWith(focoNuevo);
      }
      pintarEntrada();
    }

    function cabezaDelDia(d, k) {
      const c = el('section', 'as-hoy');
      const sesion = !d.sesion ? tx('ascent.dia.descanso') : d.sesion === 'hecha' ? tx('ascent.dia.hecha', { sesion: nombreDeSesion() }) : tx('ascent.dia.sesion', { sesion: nombreDeSesion(), hora: u.horaMin(sesionDeHoy.hora) });
      const [titulo, texto] = textosDelTitular(d, k);
      c.append(linea('as-hoy-sesion', sesion), el('h2', 'as-hoy-titulo', titulo), linea('as-hoy-texto', texto));
      if (d.sesion === 'prevista') c.appendChild(decide(d, k));
      // Tu último entreno, con los músculos que trabajó (lo pediste el 5/11): «Lunes: Pecho, Hombros, Tríceps».
      if (k.ultima && k.trabajados.length) {
        const u2 = el('div', 'as-ultimo');
        const clases = Object.fromEntries(k.trabajados.map((m) => [m.musculo, 'trabajado']));
        const nombres = k.trabajados.slice(0, 4).map((m) => nombreDelMusculo(m.musculo));
        const cuando = conMayuscula(cuandoFue(k.ultima.fecha).replace(/^el /, ''));
        u2.innerHTML = cuerpo(clases, { etiqueta: nombres.join(', ') });
        const textos = el('div');
        textos.append(el('span', 'as-ultimo-etq', tx('ascent.ultimo.titulo')), el('span', 'as-ultimo-texto', tx('ascent.ultimo.texto', { dia: cuando, musculos: nombres.join(', ') })));
        u2.appendChild(textos);
        c.appendChild(u2);
      }
      if (d.sesion === 'prevista') c.appendChild(sienteHoy(d));
      // «¿Por qué no hay un porcentaje?»: dos líneas llanas, y de ahí a «En qué se basa».
      const caja = el('div', 'as-explicacion');
      caja.append(linea(null, tx('ascent.porQueNo.texto')), boton('as-enlace', tx('ascent.porQueNo.ver'), () => abrirComo()));
      caja.hidden = !queEs;
      const b = boton('as-enlace', tx('ascent.porQueNo.enlace'), () => {
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
      if (f.que === 'entrenar') return [nombreDeSesion(), tx('ascent.foco.entrenar.' + f.como, { ejercicio: f.ejercicio || '' })];
      if (f.que === 'terminar') return [tx('ascent.foco.terminar.titulo', { hora: u.horaMin(f.antesDe) }), tx('ascent.foco.terminar.texto', { dormir: u.horaMin(f.dormir), mejor: u.horaMin(f.mejor) })];
      if (f.que === 'dormir') {
        const deuda = d.deuda !== null && d.deuda >= 7 * 60;
        return [tx('ascent.foco.dormir.titulo'), deuda ? tx('ascent.diagnostico.consejos.deuda') : tx('ascent.foco.dormir.texto', { horas: u.duracion(necesidad) })];
      }
      if (f.que === 'proteina') return [tx('ascent.foco.proteina.titulo'), n ? tx('ascent.diagnostico.consejos.totalDelDia', { g: numero(f.gramos) }) : tx('ascent.diagnostico.consejos.totalDelDiaSinNumeros')];
      if (f.que === 'descanso') {
        const falta = k.f.musculos.filter((m) => m.estado !== 'recuperado').sort((a, b) => b.residual - a.residual)[0];
        return [tx('ascent.foco.descanso.titulo'), falta ? tx('ascent.foco.descanso.cuando', { musculo: nombreDelMusculo(falta.musculo).toLowerCase(), cuando: cuandoDe(falta.cuando) }) : tx('ascent.diagnostico.sub.recuperados')];
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
        const cuerpoDelFoco = el('div');
        const [titulo, texto] = textosDelFoco(f, d, k);
        cuerpoDelFoco.append(el('b', 'as-foco-titulo', titulo));
        if (texto) cuerpoDelFoco.appendChild(linea('as-foco-texto', texto));
        if (f.que === 'faltaNoche') cuerpoDelFoco.appendChild(irA('sueno', 'ascent.diagnostico.irA.sueno'));
        li.append(hora, cuerpoDelFoco);
        ul.appendChild(li);
      });
      c.appendChild(ul);
      return c;
    }

    // ------------------------------------------------------------ de qué sale
    function fila(clase, nombre, valor, palabra, limita) {
      const f = el('article', 'as-fila ' + clase);
      const cab = el('header', 'as-fila-cab');
      cab.append(el('h4', 'as-fila-nombre', nombre), el('span', 'as-fila-valor', valor || ''), el('span', 'as-fila-palabra' + (limita ? ' limita' : ''), palabra || ''));
      f.appendChild(cab);
      return f;
    }
    const horasDe = (min) => u.duracion(Math.round(min / 5) * 5);

    function filaSueno(d, k) {
      const n = k.noche;
      const palabra = !n ? '' : n.seguidas && n.estado !== 'corta' && n.estado !== 'muyCorta' ? tx('ascent.noche.seguidas') : tx('ascent.noche.' + n.estado);
      const f = fila('as-fila-sueno', tx('ascent.filas.sueno.nombre'), n ? horasDe(n.dormido) : '—', palabra, k.titular.limita === 'sueno');
      if (!n) {
        f.append(linea('as-fila-texto', tx('ascent.filas.sueno.sinNoche')), irA('sueno', 'ascent.diagnostico.irA.sueno'));
        return f;
      }
      f.appendChild(escala(n.dormido, SUENO_TOPE, [[Rendimiento.NOCHE_CORTA, tx('ascent.filas.sueno.seis')], [necesidad, tx('ascent.filas.sueno.tuyo', { horas: u.duracion(necesidad) })]], {
        limita: k.titular.limita === 'sueno', zona: Rendimiento.NOCHE_CORTA, etiqueta: tx('ascent.filas.sueno.de', { horas: horasDe(n.dormido), necesidad: u.duracion(necesidad) }),
      }));
      const partes = [tx('ascent.filas.sueno.de', { horas: horasDe(n.dormido), necesidad: u.duracion(necesidad) })];
      if ((n.despertoAntes ?? 0) >= 60) partes.push(tx('ascent.filas.sueno.antes', { tiempo: u.duracion(Math.round(n.despertoAntes / 5) * 5) }));
      f.appendChild(linea('as-fila-texto', partes.join(' ')));
      if (n.seguidas) f.appendChild(linea('as-fila-texto', tx('ascent.filas.sueno.seguidas')));
      if (n.calidad !== null && n.calidad !== undefined) f.appendChild(linea('as-nota', tx('ascent.filas.sueno.calidad', { n: Math.round(n.calidad) })));
      const antes = d.sesion === 'prevista';
      const corta = n.estado === 'corta' || n.estado === 'muyCorta' || n.seguidas;
      if (corta) f.appendChild(consejo(tx(antes ? 'ascent.filas.sueno.consejos.cortaAntes' : 'ascent.filas.sueno.consejos.corta', { hora: aLaCama(d) })));
      else if (n.estado === 'algoCorta') f.appendChild(consejo(tx('ascent.filas.sueno.consejos.algoCorta', { hora: aLaCama(d) })));
      const consejos = k.diag ? k.diag.consejos.map((x) => x.que) : [];
      if (antes && consejos.includes('siesta')) f.appendChild(consejo(tx('ascent.diagnostico.consejos.siesta')));
      if (consejos.includes('deuda')) f.appendChild(linea('as-nota', tx('ascent.diagnostico.consejos.deuda')));
      const enlaces = el('div', 'as-enlaces');
      if (n.calidad === null || n.calidad === undefined) enlaces.appendChild(irA('manana', 'ascent.filas.sueno.anotar'));
      enlaces.appendChild(irA('corregir', 'ascent.filas.sueno.corregir'));
      f.appendChild(enlaces);
      return f;
    }

    /** Un músculo en una línea: su estado y cuándo vuelve a lo suyo (sin adjetivos con género: «espalda alta» también). */
    const detalleDelMusculo = (m) => tx('ascent.cuerpo.detalle.' + m.estado, { musculo: nombreDelMusculo(m.musculo), cuando: cuandoDe(m.cuando) });
    /** Los músculos en píldoras, cada uno con su estado. */
    function chips(musculos, chicas = false) {
      const ul = el('ul', 'as-chips' + (chicas ? ' chicas' : ''));
      musculos.forEach((m) => {
        const li = el('li', 'as-chip ' + (m.estado === 'recuperado' ? '' : m.estado));
        li.append(el('i'), document.createTextNode(nombreDelMusculo(m.musculo)));
        li.setAttribute('aria-label', detalleDelMusculo(m));
        ul.appendChild(li);
      });
      return ul;
    }

    function filaMusculos(d, k) {
      const hecha = d.sesion === 'hecha';
      const ms = hecha && k.despues ? k.despues.musculos : k.f.musculos;
      const peor = hecha && k.despues ? k.despues.peor : k.f.peor;
      const f = fila('as-fila-musculos', tx('ascent.filas.musculos.nombre'), '', peor ? tx('ascent.decide.estados.' + peor) : '', k.titular.limita === 'musculos');
      if (!ms.length) {
        f.appendChild(linea('as-fila-texto', tx('ascent.filas.musculos.nada')));
        return f;
      }
      f.appendChild(chips(ms));
      f.appendChild(linea('as-fila-texto', tx('ascent.filas.musculos.texto.' + (hecha ? 'hecha' : d.sesion ? 'prevista' : 'descanso'), { musculos: listaDeMusculos(k.musculosHoy) })));
      if (k.conEllos && !hecha) f.appendChild(linea('as-fila-texto', tx('ascent.filas.musculos.ultima', { cuando: cuandoFue(k.conEllos.sesion.fecha), n: k.conEllos.series })));
      const cuando = cuandoTodos(ms);
      if (d.sesion === 'prevista') f.appendChild(consejo(tx('ascent.filas.musculos.consejos.' + (peor || 'recuperado'), { cuando: cuandoDe(cuando) })));
      else f.appendChild(consejo(cuando === 'ya' ? tx('ascent.titular.descanso.listos') : tx(hecha ? 'ascent.filas.musculos.listos' : 'ascent.filas.musculos.listosDescanso', { cuando: cuandoDe(cuando) })));
      f.appendChild(linea('as-nota', tx('ascent.filas.musculos.nota')));
      return f;
    }

    function filaComida(d, k) {
      const c = k.comida;
      const f = fila('as-fila-comida', tx('ascent.filas.comida.nombre'), c.gPorKg !== null && conNumeros() && !sinDeficit() ? tx('ascent.filas.comida.valor', { g: numero(c.gPorKg, 1) }) : '', '');
      if (sinDeficit()) {
        f.appendChild(linea('as-fila-texto', tx('ascent.filas.comida.sinMetas')));
        return f;
      }
      if (c.gPorKg === null) {
        f.appendChild(linea('as-fila-texto', tx('ascent.filas.comida.sinDatos')));
        return f;
      }
      if (conNumeros()) {
        f.appendChild(escala(c.gPorKg, PROTEINA_TOPE, [[Estancados.PROTEINA_POR_KG, tx('ascent.filas.comida.raya')]], { etiqueta: tx('ascent.filas.comida.texto', { g: numero(c.gPorKg, 1), n: c.dias }) }));
        f.appendChild(linea('as-fila-texto', tx('ascent.filas.comida.texto', { g: numero(c.gPorKg, 1), n: c.dias }) + (c.ayer ? ' ' + tx('ascent.filas.comida.ayer', { p: numero(c.ayer.p), meta: numero(c.ayer.meta) }) : '')));
      } else f.appendChild(linea('as-fila-texto', tx('ascent.filas.comida.sinNumeros')));
      f.appendChild(linea('as-nota', tx('ascent.filas.comida.nota')));
      if (k.diag && k.diag.consejos.some((x) => x.que === 'noCompensar')) f.appendChild(linea('as-nota', tx('ascent.diagnostico.consejos.noCompensar')));
      return f;
    }

    function parteFilas(d, k) {
      const c = el('section', 'as-filas');
      c.appendChild(el('h3', 'as-etq', tx('ascent.filas.titulo')));
      c.append(filaSueno(d, k), filaMusculos(d, k), filaComida(d, k));
      return c;
    }

    // ------------------------------------------------------------ tus músculos
    function parteCuerpo(d, k) {
      const c = parte('as-musculos', tx('ascent.cuerpo.titulo'));
      c.appendChild(linea('as-una', tx('ascent.cuerpo.texto')));
      const clases = Object.fromEntries(k.todos.map((m) => [m.musculo, m.estado === 'recuperado' ? '' : m.estado]));
      const caja = el('div', 'as-cuerpo');
      caja.innerHTML = cuerpo(clases, { rotulos: true, etiqueta: tx('ascent.cuerpo.titulo') });
      const detalle = linea('as-cuerpo-detalle', '');
      detalle.setAttribute('aria-live', 'polite');
      const decir = (m) => detalleDelMusculo(m);
      // Al abrir, lo más cargado; tocar otro músculo lo cambia.
      const peor = [...k.todos].sort((a, b) => b.residual - a.residual)[0];
      const elegir = (m) => {
        caja.querySelectorAll('.as-m.elegido').forEach((x) => x.classList.remove('elegido'));
        caja.querySelectorAll(`.as-m[data-musculo="${m.musculo}"]`).forEach((x) => x.classList.add('elegido'));
        cambiar(detalle, decir(m));
      };
      caja.addEventListener('click', (ev) => {
        const forma = ev.target.closest('.as-m');
        if (forma) elegir(k.todos.find((m) => m.musculo === forma.dataset.musculo));
      });
      detalle.textContent = peor && peor.estado !== 'recuperado' ? decir(peor) : tx('ascent.cuerpo.todosDescansados');
      if (peor && peor.estado !== 'recuperado') caja.querySelectorAll(`.as-m[data-musculo="${peor.musculo}"]`).forEach((x) => x.classList.add('elegido'));
      const leyenda = el('div', 'as-leyenda-cuerpo');
      ['recuperado', 'recuperandose', 'cargado'].forEach((e) => {
        const s = el('span');
        s.append(el('i', e), document.createTextNode(tx('ascent.cuerpo.estados.' + e)));
        leyenda.appendChild(s);
      });
      caja.append(detalle, leyenda);
      c.appendChild(caja);
      // Tu semana en Ascent: cada día de la rutina con sus músculos, cómo están ahora.
      c.appendChild(el('h4', 'as-etq', tx('ascent.cuerpo.semana'))).style.marginTop = '22px';
      const ul = el('ul', 'as-semana');
      k.rutina.forEach((dia) => {
        const li = el('li', dia.hoy ? 'hoy' : '');
        const textos = el('div');
        textos.append(el('span', 'as-semana-nombre', dia.hoy ? tx('ascent.cuerpo.hoy', { nombre: dia.nombre }) : dia.nombre), chips(dia.musculos, true));
        li.append(el('span', 'as-semana-dia', tx('fecha.diasCortos.' + dia.dia)), textos);
        ul.appendChild(li);
      });
      c.append(ul, linea('as-nota', tx('ascent.cuerpo.nota')));
      return c;
    }

    // ------------------------------------------------------------ tu fuerza
    /** La tendencia en un dibujo chico: el rango de la recta, la recta y cada sesión en un punto. */
    function chispa(t, puntos) {
      const W = 128, H = 48, M = 4;
      if (!puntos.length) return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="as-spark-vacio" d="M${M} ${H / 2} H${W - M}"/></svg>`;
      const desde = -Rendimiento.SEMANAS_DE_LA_TENDENCIA, hasta = 0;
      const enVentana = puntos.filter((p) => p.t > desde);
      const banda = t.ajuste ? Array.from({ length: 13 }, (_, i) => desde + (i * (hasta - desde)) / 12).filter((x) => x >= Math.min(...enVentana.map((p) => p.t))).map((x) => [x, Rendimiento.nivelEn(t.ajuste, x)]) : [];
      const valores = [...enVentana.map((p) => p.e1rm), ...banda.flatMap(([, b]) => [b.abajo, b.arriba])];
      const lo = Math.min(...valores), hi = Math.max(...valores);
      const pad = (hi - lo) * 0.12 || 1;
      const X = (x) => M + ((x - desde) / (hasta - desde)) * (W - 2 * M);
      const Y = (v) => H - M - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 2 * M);
      let svg = '';
      if (banda.length > 1) {
        const arriba = banda.map(([x, b]) => `${X(x).toFixed(1)} ${Y(b.arriba).toFixed(1)}`);
        const abajo = [...banda].reverse().map(([x, b]) => `${X(x).toFixed(1)} ${Y(b.abajo).toFixed(1)}`);
        svg += `<path class="as-spark-banda" d="M${arriba.join(' L')} L${abajo.join(' L')} Z"/>`;
        svg += `<path class="as-spark-recta" d="M${banda.map(([x, b]) => `${X(x).toFixed(1)} ${Y(b.nivel).toFixed(1)}`).join(' L')}"/>`;
      }
      svg += enVentana.map((p) => `<circle class="as-spark-punto" cx="${X(p.t).toFixed(1)}" cy="${Y(p.e1rm).toFixed(1)}" r="1.9"/>`).join('');
      return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">${svg}</svg>`;
    }
    const conSigno1 = (n) => u.conSigno(Math.round(n * 10) / 10, 1);
    function veredicto(t) {
      if (t.estado === 'sube') return [tx('ascent.fuerza.sube', { n: conSigno1(t.porMes) }), tx('ascent.fuerza.rango', { a: conSigno1(t.rango[0]), b: conSigno1(t.rango[1]) }) + ' · ' + u.plural('ascent.fuerza.sesiones', t.sesiones)];
      if (t.estado === 'sinSubidaClara') return [tx('ascent.fuerza.sinSubidaClara'), tx('ascent.fuerza.enSemanas', { n: Math.round(t.semanas) }) + ' · ' + u.plural('ascent.fuerza.sesiones', t.sesiones)];
      return [tx('ascent.fuerza.noSeSabe'), t.sesiones < Rendimiento.SESIONES_MINIMAS ? u.plural('ascent.fuerza.faltanSesiones', t.sesiones) : tx('ascent.fuerza.faltanSemanas', { n: Math.round(t.semanas) })];
    }
    function parteFuerza(d, k) {
      const c = parte('as-fuerza', tx('ascent.fuerza.titulo'), el('span', 'as-derecha', tx('ascent.fuerza.semanas')));
      c.appendChild(linea('as-una', tx('ascent.fuerza.texto')));
      const ul = el('ul', 'as-fuerza-lista');
      k.fuerza.forEach(({ e, t, puntos }) => {
        const li = el('li', 'as-fuerza-ej ' + t.estado);
        const textos = el('div');
        const [v, dato] = veredicto(t);
        textos.append(el('span', 'as-fuerza-nombre', nombreDelEjercicio(e)), el('span', 'as-fuerza-veredicto', v), el('span', 'as-fuerza-dato', dato));
        li.appendChild(textos);
        li.insertAdjacentHTML('beforeend', chispa(t, puntos));
        li.setAttribute('aria-label', `${nombreDelEjercicio(e)}: ${v}. ${dato}`);
        ul.appendChild(li);
      });
      c.appendChild(ul);
      const sigmas = k.fuerza.filter((x) => x.t.ajuste).map((x) => x.t.sigma);
      if (sigmas.length) c.appendChild(linea('as-nota', tx('ascent.fuerza.ruido', { n: numero(sigmas.reduce((s, x) => s + x, 0) / sigmas.length, 1) })));
      return c;
    }

    // ------------------------------------------------------------ marcas, sin probabilidad
    /** Tu nivel de hoy con lo que cambia de un día a otro, y tu marca como una raya, en kg de 1RM estimado. */
    function alcance(m) {
      const marca = unRmDe(m.pr);
      const nivel = m.t.nivel;
      const c = el('div');
      const pista = el('div', 'as-alcance');
      pista.appendChild(el('i', 'as-alcance-pista'));
      const lo = Math.min(nivel * Math.exp(-2.5 * m.t.sigma / 100), marca * 0.97), hi = Math.max(nivel * Math.exp(1.5 * m.t.sigma / 100), marca * 1.02);
      const x = (v) => `${(((v - lo) / (hi - lo)) * 100).toFixed(2)}%`;
      const ruido = el('i', 'as-alcance-ruido');
      ruido.style.left = x(nivel * Math.exp(-m.t.sigma / 100));
      ruido.style.width = `calc(${x(nivel * Math.exp(m.t.sigma / 100))} - ${x(nivel * Math.exp(-m.t.sigma / 100))})`;
      const punto = el('i', 'as-alcance-nivel');
      punto.style.left = x(nivel);
      const raya = el('i', 'as-alcance-marca');
      raya.style.left = x(marca);
      pista.append(ruido, raya, punto);
      const eje = el('div', 'as-alcance-eje');
      const enKg = (v) => numero(Rendimiento.aDosYMedio(v), Rendimiento.aDosYMedio(v) % 1 ? 1 : 0);
      // Las etiquetas van abajo, una a cada lado, con la forma de lo que nombran: el punto es hoy y la raya, la marca.
      const s1 = el('span', 'hoy', tx('ascent.marcas.nivel', { kg: enKg(nivel) }));
      const s2 = el('span', 'marca', tx('ascent.marcas.marca', { kg: enKg(marca) }));
      eje.append(s1, s2);
      c.append(pista, eje);
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', `${s1.textContent} · ${s2.textContent}`);
      return c;
    }
    function parteMarcas(d, k) {
      const c = parte('as-marcas', tx('ascent.marcas.titulo'));
      if (!d.sesion) { c.appendChild(linea('as-una', tx('ascent.marcas.sinSesion'))); return c; }
      if (d.sesion === 'hecha') { c.appendChild(linea('as-una', tx('ascent.marcas.hecha', { sesion: enFrase(nombreDeSesion()) }))); return c; }
      c.appendChild(linea('as-una', tx('ascent.marcas.texto', { sesion: enFrase(nombreDeSesion()) })));
      // Los de muchas repeticiones no tienen nivel para comparar: van juntos, en una línea al final.
      const sinNivel = k.marcas.filter((m) => m.cerca.distancia === null);
      k.marcas.filter((m) => m.cerca.distancia !== null).forEach((m) => {
        const buen = !!d.noche && Diagnostico.buenDiaParaLaMarca(m);
        const f = el('article', 'as-marca2' + (m.cerca.cerca ? ' cerca' : '') + (buen ? ' si' : ''));
        const cab = el('header', 'as-marca2-cab');
        const estado = m.cerca.cerca ? tx('ascent.marcas.cerca') : tx('ascent.marcas.lejos', { n: numero(Math.round(m.cerca.distancia)) });
        cab.append(el('span', 'as-marca2-nombre', nombreDelEjercicio(m.bloque)), el('span', 'as-marca2-estado', estado));
        f.appendChild(cab);
        f.appendChild(alcance(m));
        if (m.cerca.cerca) {
          const ul = el('ul', 'as-condiciones');
          Diagnostico.CONDICIONES.forEach((cond) => {
            // Sin la noche, lo del sueño no se sabe: ni sí ni no.
            const sabe = !!d.noche || cond !== 'sueno';
            const si = sabe && m.condiciones[cond];
            const li = el('li', 'as-condicion ' + (!sabe ? '' : si ? 'si' : 'no'));
            li.innerHTML = icono(!sabe ? 'info' : si ? 'listo' : 'cerrar');
            li.appendChild(document.createTextNode(tx('ascent.marcas.condiciones.' + cond)));
            ul.appendChild(li);
          });
          f.appendChild(ul);
          const fallan = Diagnostico.queFalla(m.condiciones);
          f.appendChild(linea('as-marca2-linea', !d.noche ? tx('ascent.marcas.sinNoche') : buen ? tx('ascent.marcas.buenDia') : tx('ascent.marcas.hoyNo', { razones: lista(fallan.map((x) => tx('ascent.marcas.fallas.' + x))) })));
        }
        if (m.frecuencia.de) {
          const fr = el('div', 'as-frecuencia');
          const cuadros = el('span', 'as-cuadros');
          // De la más vieja a la última: los cuadros llenos son las sesiones con marca.
          const fechas = sesionesDe(d).filter((s) => s.fecha < Datos.HOY && s.bloques.some((b) => b.id === m.bloque.id)).map((s) => s.fecha).slice(-20);
          const conMarca = new Set(marcasDe(m.bloque.id).map((x) => x.fecha));
          fechas.forEach((fecha) => cuadros.appendChild(el('i', conMarca.has(fecha) ? 'lleno' : null)));
          fr.append(cuadros, el('span', null, tx('ascent.marcas.frecuencia', { n: m.frecuencia.marcas, de: m.frecuencia.de })));
          f.appendChild(fr);
        }
        c.appendChild(f);
      });
      if (sinNivel.length) c.appendChild(linea('as-marca2-linea', tx('ascent.marcas.sinNivelLista', { ejercicios: conMayuscula(lista(sinNivel.map((m) => enFrase(nombreDelEjercicio(m.bloque))))) })));
      c.appendChild(linea('as-nota', tx('ascent.marcas.entradaEnCalor')));
      c.appendChild(linea('as-nota', tx('ascent.marcas.nota')));
      return c;
    }

    // ------------------------------------------------------------ el estancamiento y sus razones
    /** Las series duras de cada semana: las de cuando subía, llenas; las de ahora, huecas. */
    function barras(antes, ahora) {
      const c = el('div', 'as-barras');
      const tope = Math.max(1, ...antes.map((s) => s.series), ...ahora.map((s) => s.series));
      const barra = (s, clase) => {
        const i = el('i', clase);
        i.style.height = `${Math.max(4, (s.series / tope) * 100).toFixed(1)}%`;
        return i;
      };
      antes.forEach((s) => c.appendChild(barra(s, '')));
      c.appendChild(el('b'));
      ahora.forEach((s) => c.appendChild(barra(s, 'ahora')));
      c.setAttribute('role', 'img');
      return c;
    }
    function razon(x, est) {
      const li = el('li', 'as-razon ' + x.que);
      const cab = el('div', 'as-razon-cab');
      const v1 = (n) => numero(Math.round(n * 10) / 10, Math.round(n * 10) % 10 ? 1 : 0);
      const musculo = nombreDelMusculo(est.musculo).toLowerCase();
      if (x.que === 'series') {
        cab.append(el('b', null, tx('ascent.estancados.series.titulo', { musculo })), el('span', null, `${v1(x.antes)} → ${v1(x.ahora)}`));
        const b = barras(est.antes, est.ahora);
        b.setAttribute('aria-label', tx('ascent.estancados.series.texto', { antes: v1(x.antes), ahora: v1(x.ahora) }));
        const leyenda = el('div', 'as-leyenda');
        leyenda.append(el('span', 'as-leyenda-con', tx('ascent.estancados.leyenda.antes')), el('span', 'as-leyenda-ahora', tx('ascent.estancados.leyenda.ahora')));
        li.append(cab, b, leyenda, linea(null, tx('ascent.estancados.series.texto', { antes: v1(x.antes), ahora: v1(x.ahora) })));
        return li;
      }
      if (x.que === 'frecuencia') {
        cab.append(el('b', null, tx('ascent.estancados.frecuencia.titulo')), el('span', null, `${v1(x.antes)} → ${v1(x.ahora)}`));
        li.append(cab, linea(null, tx('ascent.estancados.frecuencia.texto', { antes: v1(x.antes), ahora: v1(x.ahora) })));
        return li;
      }
      if (x.que === 'pesadas') {
        cab.append(el('b', null, tx('ascent.estancados.pesadas.titulo')), el('span', null, `${x.pesadas} / ${x.de}`));
        li.append(cab, escala(x.pesadas / x.de, 1, [[Estancados.POCAS_PESADAS, tx('ascent.estancados.pesadas.raya')]], { etiqueta: tx('ascent.estancados.pesadas.texto', { n: x.pesadas, de: x.de }) }), linea(null, tx('ascent.estancados.pesadas.texto', { n: x.pesadas, de: x.de })));
        return li;
      }
      if (x.que === 'bajando') {
        cab.append(el('b', null, tx('ascent.estancados.bajando.titulo')), el('span', null, tx('ascent.estancados.bajando.valor', { n: numero(x.porSemana, 1) })));
        li.append(cab, linea(null, tx('ascent.estancados.bajando.texto')));
        return li;
      }
      if (x.que === 'definicion') {
        cab.appendChild(el('b', null, tx('ascent.estancados.definicion.titulo')));
        li.append(cab, linea(null, tx('ascent.estancados.definicion.texto')));
        return li;
      }
      if (x.que === 'proteina') {
        cab.append(el('b', null, tx('ascent.estancados.proteina.titulo')), el('span', null, tx('ascent.filas.comida.valor', { g: numero(x.gPorKg, 1) })));
        li.append(cab, escala(x.gPorKg, PROTEINA_TOPE, [[Estancados.PROTEINA_POR_KG, tx('ascent.filas.comida.raya')]], { limita: true, etiqueta: tx('ascent.estancados.proteina.texto', { g: numero(x.gPorKg, 1) }) }), linea(null, tx('ascent.estancados.proteina.texto', { g: numero(x.gPorKg, 1) })));
        return li;
      }
      cab.append(el('b', null, tx('ascent.estancados.sueno.titulo')), el('span', null, horasDe(x.ahora)));
      li.append(cab, escala(x.ahora, SUENO_TOPE, [[Rendimiento.NOCHE_CORTA, tx('ascent.filas.sueno.seis')]], { zona: Rendimiento.NOCHE_CORTA, etiqueta: horasDe(x.ahora) }),
        linea(null, x.antes !== null ? tx('ascent.estancados.sueno.texto', { ahora: horasDe(x.ahora), antes: horasDe(x.antes) }) : tx('ascent.estancados.sueno.sinAntes', { ahora: horasDe(x.ahora) })));
      return li;
    }
    function parteEstancamiento(d, k) {
      const c = parte('as-estanc', tx('ascent.estancados.titulo'));
      c.appendChild(linea('as-una', tx('ascent.estancados.texto', { n: A.umbral })));
      if (!k.estancados.length) { c.appendChild(linea('as-razon-sin', tx('ascent.estancados.ninguno'))); return c; }
      // Lo que es de la persona y no del ejercicio (bajar, la definición, la proteína y el sueño), si les toca a
      // todos, va una vez, arriba; los años de entrenamiento, al final.
      const DE_LA_PERSONA = ['bajando', 'definicion', 'proteina', 'sueno'];
      const comunes = k.estancados.length > 1 ? DE_LA_PERSONA.filter((q) => k.estancados.every((e) => e.r.razones.some((x) => x.que === q))) : [];
      if (comunes.length) {
        const g = el('article', 'as-estanc-ej as-estanc-comunes');
        g.appendChild(el('header', 'as-estanc-ej-cab')).appendChild(el('span', 'as-estanc-ej-nombre', tx('ascent.estancados.comunes')));
        const ul = el('ul', 'as-razones');
        k.estancados[0].r.razones.filter((x) => comunes.includes(x.que)).forEach((x) => ul.appendChild(razon(x, k.estancados[0])));
        g.appendChild(ul);
        c.appendChild(g);
      }
      k.estancados.forEach((est) => {
        const g = el('article', 'as-estanc-ej');
        const cab = el('header', 'as-estanc-ej-cab');
        const marca = tx('ascent.estancamiento.marca', { kg: numero(est.ultima.peso, est.ultima.peso % 1 ? 1 : 0), reps: est.ultima.reps });
        cab.append(el('span', 'as-estanc-ej-nombre', nombreDelEjercicio(est.e)), el('span', 'as-estanc-ej-dato', tx('ascent.estancados.dato', { n: est.sinMarca, marca })));
        g.appendChild(cab);
        const propias = est.r.razones.filter((x) => !comunes.includes(x.que));
        if (propias.length) {
          const ul = el('ul', 'as-razones');
          propias.forEach((x) => ul.appendChild(razon(x, est)));
          g.appendChild(ul);
        } else g.appendChild(linea('as-razon-sin', tx(comunes.length ? 'ascent.estancados.soloComunes' : 'ascent.estancados.sinCausa')));
        if (est.r.faltan.includes('comida') || est.r.faltan.includes('sueno')) g.appendChild(linea('as-nota', tx('ascent.estancados.faltan')));
        c.appendChild(g);
      });
      if (k.estancados.some((e) => e.r.anios !== null)) c.appendChild(linea('as-contexto', tx('ascent.estancados.anios')));
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
        li.append(el('i', m.grupo), el('span', null, `${tx('ascent.hoy.grupos.' + m.grupo)}: ${enFrase(nombreDelEjercicio(m))} ${tx('ascent.estancamiento.marca', { kg: numero(m.peso, m.peso % 1 ? 1 : 0), reps: m.reps })}`), el('small', null, semanas ? u.plural('ascent.anio.hace', semanas) : tx('ascent.anio.estaSemana')));
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

    // ------------------------------------------------------------ en qué se basa
    function parteComo() {
      const c = el('section', 'as-como' + (como ? ' abierta' : ''));
      const cuerpoDeComo = el('div', 'as-como-cuerpo');
      cuerpoDeComo.hidden = !como;
      const cab = boton('as-como-cab', `<span>${tx('ascent.base.titulo')}</span>${icono('abajo')}`, () => {
        como = !como;
        c.classList.toggle('abierta', como);
        cab.setAttribute('aria-expanded', String(como));
        desplegar(cuerpoDeComo, como);
      });
      cab.setAttribute('aria-expanded', String(como));
      const parrafo = (clave, vars) => {
        const t = tx(clave, vars);
        const i = t.indexOf(':');
        const pp = el('p');
        if (i > 0) pp.append(el('b', null, t.slice(0, i + 1)), document.createTextNode(t.slice(i + 1)));
        else pp.textContent = t;
        return pp;
      };
      ['porcentaje', 'titular', 'noche', 'musculos', 'fuerza', 'marca', 'estancamiento', 'comer', 'orientativo'].forEach((k2) => cuerpoDeComo.appendChild(parrafo('ascent.base.' + k2, { necesidad: u.duracion(necesidad) })));
      c.append(cab, cuerpoDeComo);
      return c;
    }

    // ------------------------------------------------------------ sin vincular
    // Arriba de todo, «Ascent» (5/11): sin vincular, el título grande; vinculada, chico, arriba del titular.
    function cabezaSinVincular() {
      const cab = el('header', 'as-cab');
      cab.append(
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
    function decideVacio() {
      const ul = el('ul', 'as-decide');
      [['sueno', 'noche'], ['pesa', 'musculos'], ['corazon', 'siente']].forEach(([icon, k]) => {
        const li = el('li');
        const i = el('span', 'as-decide-icono');
        i.innerHTML = icono(icon);
        li.append(i, el('span', 'as-decide-nombre', tx('ascent.decide.' + k)), el('span', 'as-decide-valor', '—'));
        ul.appendChild(li);
      });
      ul.style.marginTop = '12px';
      return ul;
    }
    /** Las tres filas vacías, con lo que van a mostrar: las rayas de las escalas y los músculos apagados. */
    function filasVacias() {
      const caja = el('div');
      const sueno = fila('as-fila-sueno', tx('ascent.filas.sueno.nombre'), '—', '', false);
      sueno.appendChild(escala(null, SUENO_TOPE, [[Rendimiento.NOCHE_CORTA, tx('ascent.filas.sueno.seis')], [necesidad, tx('ascent.filas.sueno.tuyo', { horas: u.duracion(necesidad) })]], { zona: Rendimiento.NOCHE_CORTA }));
      const musculos = fila('as-fila-musculos', tx('ascent.filas.musculos.nombre'), '—', '', false);
      musculos.appendChild(chips(['cuadriceps', 'gluteos', 'pecho', 'espaldaAlta'].map((m) => ({ musculo: m, estado: 'recuperado', cuando: 'ya' }))));
      const comida = fila('as-fila-comida', tx('ascent.filas.comida.nombre'), '—', '', false);
      comida.appendChild(escala(null, PROTEINA_TOPE, [[Estancados.PROTEINA_POR_KG, tx('ascent.filas.comida.raya')]]));
      caja.append(sueno, musculos, comida);
      return caja;
    }
    function cuerpoVacio() {
      const caja = el('div', 'as-cuerpo');
      caja.innerHTML = cuerpo({}, { rotulos: true, etiqueta: tx('ascent.cuerpo.titulo') });
      return caja;
    }
    function fuerzaVacia() {
      const ul = el('ul', 'as-fuerza-lista');
      ['sentadilla', 'press_banca', 'peso_muerto'].forEach((id) => {
        const li = el('li', 'as-fuerza-ej noSeSabe');
        const textos = el('div');
        textos.append(el('span', 'as-fuerza-nombre', tx('ascent.ejercicios.' + id)), el('span', 'as-fuerza-veredicto', '—'));
        li.appendChild(textos);
        li.insertAdjacentHTML('beforeend', chispa({}, []));
        ul.appendChild(li);
      });
      return ul;
    }

    // ------------------------------------------------------------ pintar
    // El final, abajo, pegado a Progreso: volver es bajar, así que la flecha apunta para abajo.
    function pie() {
      const c = el('div', 'as-final');
      if (vinculada) c.appendChild(linea('as-pie', tx('ascent.desvincular')));
      c.appendChild(boton('as-volver-abajo', `<span>${tx('ascent.volverAProgreso')}</span>${icono('abajo')}`, () => cerrar()));
      return c;
    }

    // Se llega por abajo: lo principal (con la marca) va abajo, pegado a Progreso, y el resto, subiendo, del más al
    // menos importante; arriba de todo, el cielo. Al volver a pintar, se queda donde estaba contando desde abajo.
    function pintar() {
      const desdeAbajo = cont.scrollHeight - cont.scrollTop;
      [...contenido.children].forEach((n) => n !== principal && n.remove());
      [...principal.children].forEach((n) => n !== marca && n.remove());
      if (principal.parentNode !== contenido) contenido.appendChild(principal);
      zona.classList.toggle('vinculada', vinculada);
      const d = elDia();
      if (vinculada) {
        const k = calcularDia(d);
        principal.append(el('p', 'as-etq as-nombre', tx('ascent.titulo')), cabezaDelDia(d, k));
        const resto = [
          parteFoco(d, k), parteFilas(d, k), parteCuerpo(d, k), parteFuerza(d, k), parteMarcas(d, k), parteEstancamiento(d, k),
          parteAnio(), parteComparten(d), parteComo(),
        ].filter(Boolean);
        principal.before(...resto.reverse());
        principal.after(pie());
      } else {
        principal.append(cabezaSinVincular());
        const vacias = [
          vacia('as-hoy-vacio', tx('ascent.vacio.titular'), tx('ascent.vacio.titularTexto'), decideVacio()),
          vacia('as-filas-vacias', tx('ascent.filas.titulo'), tx('ascent.vacio.filas'), filasVacias()),
          vacia('as-musculos', tx('ascent.cuerpo.titulo'), tx('ascent.vacio.cuerpo'), cuerpoVacio()),
          vacia('as-fuerza', tx('ascent.fuerza.titulo'), tx('ascent.vacio.fuerza'), fuerzaVacia()),
          vacia('as-marcas', tx('ascent.marcas.titulo'), tx('ascent.vacio.marcas'), null),
          vacia('as-estanc', tx('ascent.estancados.titulo'), tx('ascent.vacio.estancamiento'), null),
          vacia('as-anio', tx('ascent.anio.titulo'), tx('ascent.vacio.anio'), mapaDelAnio(false)),
        ];
        principal.before(el('h3', 'as-grupo', tx('ascent.soloConLasDos')), ...vacias.reverse());
        principal.after(pie());
      }
      pintarEntrada();
      cont.scrollTop = cont.scrollHeight - desdeAbajo;
      ponerCielo();
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
    // El cuerpo baja con la sección más despacio que ella (está más lejos). Lejos de arriba de todo apenas asoma, tenue,
    // detrás del texto; en el último tramo para arriba baja entero y se enciende, en el cielo vacío de arriba.
    function ponerCielo() {
      const lejos = clamp(cont.scrollTop / CUERPO_SUBIR, 0, 1);
      const arriba = cielo.classList.contains('polvo') ? NUBE_LEJOS : CUERPO_LEJOS;
      const baja = (1 - p) * (zona.clientHeight || 0) * (1 - CUERPO_SIGUE) - lejos * arriba;
      cielo.style.setProperty('--baja', `${baja.toFixed(1)}px`);
      cielo.style.setProperty('--cerca', (1 - 0.45 * lejos).toFixed(3));
    }
    cont.addEventListener('scroll', ponerCielo, { passive: true });
    // Se llega por abajo, a lo principal.
    function aterrizar() {
      cont.scrollTop = cont.scrollHeight;
      ponerCielo();
    }
    function poner(v) {
      p = clamp(v, 0, 1);
      zona.style.transform = `translate3d(0, ${(-(1 - p) * 100).toFixed(3)}%, 0)`;
      zona.style.visibility = p > 0.0005 ? 'visible' : 'hidden';
      zona.inert = p === 0;
      velo.style.opacity = (0.32 * p).toFixed(3);
      ponerCielo();
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
        aterrizar();
        queEs = false;
        como = false;
        // Ya se abrió una vez: al volver a Progreso, la pista se pliega a la vista.
        if (yaSeAbrio && !entrada.classList.contains('sin-pista')) setTimeout(() => plegarLaPista(true), opciones.movimientoReducido ? 0 : 450);
      }
      if (abierta && !yaSeAbrio) yaSeAbrio = true;
      if (opciones.alCambiar) opciones.alCambiar();
    }
    function abrir(deUna) {
      if (!abierta) {
        pintar();
        aterrizar();
      }
      ir(1, deUna);
    }
    function cerrar(deUna) { ir(0, deUna); }

    // Para volver, bajar: empujar para arriba abajo de todo, siguiendo al dedo, o con la rueda; y la flecha.
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
      // Tu rango en Ascent (1 a 7; en el 4, el planeta del día).
      ponerRango,
      get rango() { return rangoActual; },
      // La entrada del encabezado de Progreso: siempre el mismo nodo.
      marcaDeProgreso() { pintarEntrada(); return entrada; },
      // Progreso se volvió a pintar o se movió: el borde del planeta, según lo arriba que esté.
      mirarArriba() { ponerTecho(); },
      // Mientras se desliza entre pestañas, el borde del planeta se va con Progreso.
      seguirPagina(x) { corrida = x; techo.style.translate = `${x.toFixed(1)}px 0`; ponerTecho(); },
      // Para los botones de la galería: «Ahora no» se olvida al recargar o con esto.
      // Para los botones de la galería: como si hubieran pasado las 4 horas del «Ahora no».
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
      arrastrar(fr) {
        cancelAnimationFrame(animacion);
        animacion = 0;
        if (!abierta && p === 0) {
          pintar();
          aterrizar();
        }
        poner(fr);
      },
      soltar(abrirla) { ir(abrirla ? 1 : 0); },
      ponerVinculo(si) {
        vinculada = si;
        marca.classList.toggle('unida', si);
        if (si) quitarInvitacion();
        opciones.repintarInicio();
        pintar();
        entraElContenido();
      },
      // Para Sueño, mientras siga mostrando el número de antes (galeria/src/sueno.js): la persona de mentira, no
      // el día de ejemplo. Cuando se apruebe lo nuevo, Sueño muestra titularDeHoy() en su lugar.
      recuperacionDeHoy: () => (vinculada ? recuperadoDeAntes() : null),
      // El titular de hoy de la persona de mentira, en dos líneas y sin porcentaje: { que, limita, titulo, texto }.
      titularDeHoy: () => (vinculada ? titularParaAfuera() : null),
      // La marca chica, la del ícono de Ascent: para la etiqueta de tu energía en Inicio.
      marcaChica: () => MARCA_CHICA,
      // Para las capturas: la hoja de vincular.
      abrirVincular,
      get hojaVincularAbierta() { return hojaVincular.abierta; },
      cerrarVincular() { clearTimeout(esperaDeLaHoja); hojaVincular.cerrar(true); },
      // La línea del rendimiento en Sueño, la de antes; lo nuevo es una línea solo con la noche corta (lineaDeHoy).
      rendimientoDeHoy: () => (vinculada ? rendimientoDeAntes() : null),
      lineaDeHoy: () => {
        const anoche = opciones.anoche();
        const ultimas3 = [0, 1, 2].map((k) => opciones.noches().find((n) => n.clave === Fechas.sumarDias(Datos.HOY, -k))).filter(Boolean).map((n) => n.dormido);
        return vinculada && anoche && Rendimiento.lineaDelRendimiento({ dormido: anoche.dormido, necesidad, despertoAntes: null }, ultimas3) ? tx('ascent.linea.suenoCorto') : null;
      },
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
