// La sección de Ascent (spec/ascent.md, «Ascent en Progreso», para aprobar), abajo de Progreso: al llegar
// abajo y seguir subiendo el dedo sube, como se entra a tu universo desde Hábitos, y su planeta crece hasta
// ser el horizonte. Arriba de la barra de Progreso, siempre, una pestaña dice que ahí está; al final del
// scroll asoma el planeta. Se vuelve deslizando para abajo, con la flecha de arriba o tocando Progreso.
// Tiene el lenguaje de Ascent (spec/estetica.md de su repo): un número grande sin caja, línea y aire,
// octágono donde algo es la acción, píldora para lo que se elige y lo secundario subrayado.
// Vinculada, lo primero es el diagnóstico (Diagnostico, src/dominio/diagnostico.ts). Lo que puede confundir
// lleva un gráfico y una línea: el rendimiento esperado (Rendimiento), la fatiga de cada músculo (Musculos),
// los días para intentar marca y por qué no subes (Entrenamiento). Sin vincular, cada cosa se ve vacía.
// La señal y la invitación de Inicio salen de SenalDeAscent (src/dominio/senalDeAscent.ts).

const SeccionAscent = (() => {
  const PARTES = ['sueno', 'carga', 'comida'];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // La hora de cada comida, si no se anotó (HORA_TIPICA en la app).
  const HORA_DE_COMIDA = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };
  // El planeta, en píxeles sobre la barra: cuánto asoma al final de Progreso y dónde queda de horizonte.
  const ASOMA_PX = 58;
  const HORIZONTE_PX = 74;
  // La escala de la fuerza y las repeticiones: la de la fórmula (spec/rendimiento.md).
  const ESCALA = [-15, 4];
  // Hasta dónde llega la barra de cada músculo, en %: cargado es desde el 10.
  const TOPE_MUSCULO = 15;
  // Las diferencias de Por qué no subes: cada una en su escala, las de porQueNoSube.
  const ESCALAS = { sueno: 45, proteina: 15, calorias: 250 };

  const CORTE = (c) => `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;
  const CORTE_ARRIBA = (c) => `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, 0 100%, 0 ${c}px)`;

  const CSS = `
.tel .ascent, .as-senal, .as-asomo, .tel .hb.as-hoja {
  --as-fondo: #05060a; --as-hoja: #0b0d13; --as-tinta: #e8ecf6; --as-sub: #aab2c4; --as-apagado: #9098ab; --as-tenue: #4a5163;
  --as-linea: #303748; --as-linea-fuerte: #3e4659; --as-principal: #7e8ca8; --as-claro: #c4c2ba; --as-lejos: #cb8569;
}
/* El cielo sigue detrás, como a tu universo; apenas oscurecido para leer. */
.tel .ascent { visibility: hidden; color: var(--as-tinta); will-change: transform; background: linear-gradient(180deg, rgba(5, 6, 10, 0) 0, rgba(5, 6, 10, 0.42) 180px, rgba(5, 6, 10, 0.6) 100%); }
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
.unida > .as-marca-chica .as-chica-sin { opacity: 0; }
.unida > .as-marca-chica .as-chica-con { opacity: 0.9; }
.unida > .as-marca-chica .as-chica-luna { transform: translate(6.55px, -4.59px); opacity: 1; }

/* El planeta de Ascent, que crece hasta ser el horizonte. Debajo de la barra; lo de Moss sigue arriba. */
.as-horizonte { position: absolute; left: 0; right: 0; bottom: 0; height: 62%; z-index: 2; overflow: hidden; pointer-events: none; visibility: hidden; --sube: 0px; --escala: 0.8; }
.as-horizonte i { position: absolute; left: 66%; top: calc(100% - var(--pestanas) - var(--sube)); width: 1180px; height: 1180px; margin-left: -590px; border-radius: 50%; background: radial-gradient(circle at 50% 0, #14161e 0, #0a0b11 34%, #05060a 62%); box-shadow: 0 0 30px rgba(196, 194, 186, 0.13), inset 0 18px 44px rgba(196, 194, 186, 0.07); transform: scale(var(--escala)); transform-origin: 50% 0; will-change: transform, top; }
.as-horizonte i::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from -40deg, rgba(232, 228, 212, 0.12) 0deg, rgba(232, 228, 212, 0.86) 24deg, rgba(232, 228, 212, 0.34) 46deg, rgba(232, 228, 212, 0.04) 70deg, rgba(232, 228, 212, 0) 320deg, rgba(232, 228, 212, 0.12) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); }

.tel.hoja-anim > .as-horizonte { transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1); }
.tel.con-hoja > .as-horizonte { transform: scale(0.93); transform-origin: 50% 0; }

/* La pestaña de Progreso: sale de la barra, cortada arriba, como la hoja que sube. */
.as-senal { appearance: none; cursor: pointer; box-sizing: border-box; position: absolute; left: 50%; bottom: var(--pestanas); translate: -50% 0; z-index: 2; display: inline-flex; align-items: center; gap: 8px; min-height: 42px; padding: 6px 13px 6px 9px; border: 0; background: var(--as-linea-fuerte); clip-path: ${CORTE_ARRIBA(10)}; color: var(--as-tinta); text-align: left; white-space: nowrap; touch-action: none; transition: opacity 0.25s; }
.as-senal::before { content: ''; position: absolute; inset: 1px 1px 0 1px; background: var(--as-hoja); clip-path: ${CORTE_ARRIBA(10)}; transition: background-color 0.15s; }
.as-senal:active::before { background: #171a23; }
.as-senal > * { position: relative; }
.as-senal-textos { display: grid; gap: 2px; }
.as-senal-texto { font: 400 13px/1.1 var(--texto); }
.as-senal-pista { font: 400 10.5px/1.1 var(--texto); color: var(--as-sub); max-height: 13px; overflow: hidden; transition: max-height 0.3s, opacity 0.3s; }
.as-senal.sin-pista .as-senal-pista { max-height: 0; opacity: 0; }
.as-senal > svg:last-child { width: 15px; height: 15px; flex: none; color: var(--as-sub); stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; animation: as-respira 2.8s ease-in-out infinite; }
@keyframes as-respira { 50% { transform: translateY(-3px); opacity: 0.55; } }
.as-senal.asoma { animation: as-senal-asoma 1.5s ease-in-out 0.8s 1 both; }
@keyframes as-senal-asoma { 0%, 44%, 80%, 100% { transform: translateY(0); } 22% { transform: translateY(-10px); } 62% { transform: translateY(-5px); } }
.progreso.en-metas .as-senal { opacity: 0 !important; pointer-events: none !important; }

/* El final de Progreso: lo mismo que la pestaña, más grande, con el planeta asomando debajo. */
.as-asomo { appearance: none; cursor: pointer; display: grid; justify-items: center; gap: 5px; width: 100%; margin-top: 30px; padding: 6px 0 ${ASOMA_PX - 22}px; border: 0; background: none; color: var(--as-tinta); }
.as-asomo svg { width: 21px; height: 21px; color: var(--as-sub); stroke-width: 1.8; animation: as-respira 2.8s ease-in-out infinite; }
.as-asomo b { font: 400 16px/1.2 var(--texto); }
.as-asomo span { font: 400 12.5px/1.2 var(--texto); color: var(--as-sub); }

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
.as-etq { display: block; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; color: var(--as-sub); }

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
.as-parte { margin: 26px -22px 0; padding: 14px 22px 0; border-top: 1px solid var(--as-linea); }
.as-grupo + .as-parte { margin-top: 12px; border-top: 0; padding-top: 6px; }
.as-parte-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 22px; }
.as-derecha { font: 400 11.5px/1.2 var(--texto); color: var(--as-sub); font-variant-numeric: tabular-nums; text-align: right; }
.as-candado { flex: none; display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px 4px 7px; border-radius: 999px; border: 1px solid var(--as-linea-fuerte); font: 400 10px/1 var(--texto); letter-spacing: 0.06em; color: var(--as-sub); }
.as-candado svg { width: 12px; height: 12px; stroke-width: 1.8; }
.as-una { margin: 6px 0 0; font: 400 13px/1.35 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-nota { margin: 8px 0 0; font: 400 11.5px/1.35 var(--texto); color: var(--as-apagado); font-variant-numeric: tabular-nums; }
.as-enlace { appearance: none; cursor: pointer; display: block; width: fit-content; margin-top: 14px; padding: 0 0 3px; border: 0; border-bottom: 1px solid rgba(170, 178, 196, 0.42); border-radius: 0; background: none; color: var(--as-sub); font: 400 12.5px/1.2 var(--texto); }
.as-explicacion { margin: 10px 0 0; font: 400 12.5px/1.45 var(--texto); color: var(--as-sub); }
.as-explicacion { overflow: hidden; }
.as-explicacion p { margin: 0 0 8px; }

/* El diagnóstico: un número grande sin caja, con la barra debajo. */
.as-diag { margin-top: 8px; }
.as-cifra { margin: 6px 0 0 -4px; font: 200 112px/0.94 var(--numeros); letter-spacing: -0.045em; color: var(--as-claro); }
.as-cifra.vacia { color: var(--as-apagado); font-size: 72px; line-height: 105px; }
.as-cifra-pie { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; margin-top: 6px; font: 400 14px/1.3 var(--texto); color: var(--as-tinta); }
.as-cifra-pie span { color: var(--as-sub); }
.as-cifra-pie b { font-weight: 400; }
.as-segmentos { display: grid; grid-template-columns: 2fr 2fr 1fr; gap: 3px; margin-top: 14px; }
.as-segmento { display: grid; gap: 6px; min-width: 0; }
.as-segmento > i { position: relative; display: block; height: 3px; overflow: hidden; background: var(--as-linea-fuerte); }
.as-segmento > i > i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--as-claro); }
.as-segmento span { font: 400 11px/1.2 var(--texto); color: var(--as-sub); white-space: nowrap; }
.as-segmento b { margin-left: 4px; font: 400 11px/1 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.as-titular { margin: 22px 0 0; font: 400 21px/1.22 var(--texto); color: var(--as-tinta); text-wrap: balance; }
.as-sub { margin: 7px 0 0; font: 400 13.5px/1.35 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-figuras { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); margin: 18px -22px 0; border-top: 1px solid var(--as-linea); border-bottom: 1px solid var(--as-linea); }
.as-figura { display: grid; gap: 4px; padding: 11px 6px 11px 14px; border-left: 1px solid var(--as-linea); min-width: 0; }
.as-figura:first-child { padding-left: 22px; border-left: 0; }
.as-figura b { font: 300 22px/1.05 var(--numeros); letter-spacing: -0.01em; font-variant-numeric: tabular-nums; color: var(--as-tinta); white-space: nowrap; }
.as-figura span { font: 400 11.5px/1.2 var(--texto); color: var(--as-sub); }
.as-pasos { margin-top: 4px; }
.as-paso { padding: 11px 0 12px; border-top: 1px solid var(--as-linea); }
.as-paso:first-child { border-top: 0; }
.as-paso header { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-paso header b { font: 400 13.5px/1.2 var(--texto); color: var(--as-tinta); }
.as-paso p { margin: 5px 0 0; font: 400 13.5px/1.38 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-consejos { margin: 4px 0 0; padding: 0; list-style: none; display: grid; gap: 7px; }
.as-consejos li { position: relative; padding-left: 13px; font: 400 13.5px/1.38 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.as-consejos li::before { content: ''; position: absolute; left: 1px; top: 0.56em; width: 4px; height: 4px; border-radius: 50%; background: var(--as-claro); }
.as-etq.as-para-hoy { margin-top: 18px; }
.as-falta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-top: 14px; font: 400 13.5px/1.35 var(--texto); color: var(--as-tinta); }
.as-falta .as-enlace { flex: none; margin: 0; white-space: nowrap; }

/* El día: las comidas, la sesión y ahora, sobre una línea. */
.as-dia { position: relative; height: 72px; margin: 20px 0 4px; }
.as-dia-base { position: absolute; left: 0; right: 0; top: 33px; height: 1px; background: var(--as-linea-fuerte); }
.as-dia-comida { position: absolute; top: 8px; translate: -50% 0; display: grid; justify-items: center; gap: 7px; }
.as-dia-comida span { font: 400 10.5px/1 var(--texto); color: var(--as-apagado); white-space: nowrap; }
.as-dia-comida i { display: block; width: 9px; height: 9px; border-radius: 50%; box-sizing: border-box; border: 1.5px solid var(--as-apagado); background: var(--as-fondo); box-shadow: 0 0 0 2px var(--as-fondo); }
.as-dia-comida.anotada i { background: var(--as-apagado); }
.as-dia-comida.marcada span { color: var(--as-tinta); }
.as-dia-comida.marcada i { border-color: var(--as-claro); box-shadow: 0 0 0 2px var(--as-fondo), 0 0 0 3.5px rgba(196, 194, 186, 0.45); }
.as-dia-sesion { position: absolute; top: 30px; height: 7px; border-radius: 2px; background: var(--as-claro); }
.as-dia-sesion span { position: absolute; right: 0; top: 15px; font: 400 10.5px/1 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.as-dia-ahora { position: absolute; top: 25px; width: 1px; height: 18px; background: var(--as-sub); }
.as-dia-ahora span { position: absolute; left: 50%; top: 23px; translate: -50% 0; font: 400 10.5px/1 var(--texto); color: var(--as-sub); white-space: nowrap; }
.as-dia.ahora-antes .as-dia-sesion span { right: auto; left: 0; }
.as-dia.ahora-antes .as-dia-ahora span { left: auto; right: 0; translate: 0 0; }
.as-dia.ahora-despues .as-dia-ahora span { left: 0; translate: 0 0; }

/* Hoy en Ascent: la semana del control, en columnas finas, con el valor solo en hoy. */
.as-hoy-sesion { margin-top: 8px; font: 400 16px/1.25 var(--texto); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.as-hoy-meta { margin: 5px 0 0; font: 400 13.5px/1.35 var(--texto); color: var(--as-sub); font-variant-numeric: tabular-nums; }
.as-semana { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; margin-top: 14px; }
.as-semana-dia { height: 92px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 5px; min-width: 0; }
.as-semana-dia b { font: 400 10.5px/1 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; white-space: nowrap; }
.as-semana-dia i { width: 3px; border-radius: 2px 2px 0 0; background: var(--as-linea-fuerte); }
.as-semana-dia.gimnasio i { background: var(--as-claro); }
.as-semana-dia.previsto i { background: none; border-left: 1px dashed var(--as-apagado); width: 0; border-radius: 0; }
.as-semana-dia span { font: 400 10.5px/1 var(--texto); color: var(--as-apagado); }
.as-semana-dia.hoy span { color: var(--as-tinta); }
.as-leyenda { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font: 400 11px/1 var(--texto); color: var(--as-sub); }
.as-leyenda span::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 6px; vertical-align: -0.5px; box-sizing: border-box; border-radius: 50%; background: var(--as-linea-fuerte); }
.as-leyenda .as-leyenda-gimnasio::before, .as-leyenda .as-leyenda-con::before { background: var(--as-claro); }
.as-leyenda .as-leyenda-previsto::before, .as-leyenda .as-leyenda-ahora::before { background: none; border: 1.5px solid var(--as-principal); }
.as-hoja-entrar.as-gimnasio-sumar { margin-top: 12px; }

/* El rendimiento: cada número sobre su escala, con lo tuyo marcado y el margen de un día a otro. */
.as-rend-fila { margin-top: 14px; }
.as-rend-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font: 400 13.5px/1.2 var(--texto); color: var(--as-sub); }
.as-rend-cab b { font: 400 13.5px/1.2 var(--texto); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.as-escala { position: relative; height: 22px; margin-top: 5px; }
.as-escala-base { position: absolute; left: 0; right: 0; top: 10px; height: 1px; background: var(--as-linea-fuerte); }
.as-escala-normal { position: absolute; top: 5px; height: 11px; background: rgba(170, 178, 196, 0.13); }
.as-escala-cero { position: absolute; top: 2px; width: 1px; height: 17px; background: var(--as-sub); }
.as-escala-margen { position: absolute; top: 9px; height: 3px; border-radius: 2px; background: var(--as-principal); }
.as-escala-punto { position: absolute; top: 5.5px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--as-claro); box-shadow: 0 0 0 2px var(--as-fondo); }
.as-escala-eje { position: relative; height: 12px; margin-top: 2px; font: 400 10.5px/1 var(--texto); color: var(--as-apagado); }
.as-escala-eje span { position: absolute; top: 0; translate: -50% 0; white-space: nowrap; }
.as-escala-eje span:first-child { left: 0; translate: 0 0; }
.as-escala-eje span:last-child { right: 0; translate: 0 0; }
.as-motivos { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 5px; }
.as-motivos li { position: relative; padding-left: 13px; font: 400 13px/1.35 var(--texto); color: var(--as-tinta); }
.as-motivos li::before { content: ''; position: absolute; left: 1px; top: 0.56em; width: 4px; height: 4px; border-radius: 50%; background: var(--as-claro); }

/* Los músculos: lo que le falta a cada uno, sobre la misma escala, y en palabras. */
.as-musc-eje { position: relative; height: 12px; margin: 12px 108px 0 88px; font: 400 10.5px/1 var(--texto); color: var(--as-apagado); }
.as-musc-eje span { position: absolute; top: 0; translate: -50% 0; }
.as-musculos-lista { margin: 4px 0 0; padding: 0; list-style: none; }
.as-musc { display: grid; grid-template-columns: 78px minmax(0, 1fr) 98px; align-items: center; column-gap: 10px; min-height: 40px; padding: 5px 0; border-top: 1px solid var(--as-linea); }
.as-musc-nombre { font: 400 13px/1.15 var(--texto); color: var(--as-tinta); }
.as-musc-barra { position: relative; height: 4px; background: var(--as-linea); }
.as-musc-barra::before, .as-musc-barra::after { content: ''; position: absolute; top: -3px; width: 1px; height: 10px; background: var(--as-linea-fuerte); }
.as-musc-barra::before { left: ${((3 / TOPE_MUSCULO) * 100).toFixed(2)}%; }
.as-musc-barra::after { left: ${((10 / TOPE_MUSCULO) * 100).toFixed(2)}%; }
.as-musc-barra i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 0 2px 2px 0; background: var(--as-claro); }
.as-musc.cargado .as-musc-barra i { background: var(--as-lejos); }
.as-musc-estado { display: grid; gap: 2px; justify-items: end; text-align: right; }
.as-musc-estado b { font: 400 12px/1.1 var(--texto); color: var(--as-tinta); }
.as-musc-estado small { font: 400 10.5px/1.1 var(--texto); color: var(--as-sub); }

/* La marca: las cinco condiciones, y la probabilidad contra lo que hace falta para avisar. */
.as-pr-titulo { margin: 8px 0 0; font: 400 17px/1.25 var(--texto); color: var(--as-tinta); text-wrap: balance; }
.as-condiciones { margin: 12px 0 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.as-condicion { display: flex; align-items: center; gap: 9px; font: 400 13px/1.25 var(--texto); color: var(--as-tinta); }
.as-condicion i { flex: none; display: grid; place-items: center; width: 14px; height: 14px; box-sizing: border-box; border-radius: 50%; border: 1px solid var(--as-apagado); color: var(--as-fondo); }
.as-condicion svg { display: none; width: 10px; height: 10px; stroke-width: 2.6; }
.as-condicion.si i { border-color: var(--as-claro); background: var(--as-claro); }
.as-condicion.si svg { display: block; }
.as-condicion.no, .ascent:not(.vinculada) .as-condicion { color: var(--as-sub); }
.as-medidor { position: relative; height: 22px; margin-top: 16px; }
.as-medidor-pista { position: absolute; left: 0; right: 0; top: 10px; height: 2px; background: var(--as-linea-fuerte); }
.as-medidor-tramo { position: absolute; left: 0; top: 10px; height: 2px; background: var(--as-claro); }
.as-medidor-corte { position: absolute; top: 3px; width: 1px; height: 16px; background: var(--as-sub); }
.as-medidor-punto { position: absolute; top: 6px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--as-claro); box-shadow: 0 0 0 2px var(--as-fondo); }
.as-medidor-eje { position: relative; height: 13px; margin-top: 1px; font: 400 10.5px/1 var(--texto); color: var(--as-apagado); }
.as-medidor-eje span { position: absolute; top: 0; translate: -50% 0; white-space: nowrap; }
.as-medidor-eje span.dato { color: var(--as-tinta); }

/* Por qué no subes: tus semanas con marcas contra las de ahora, cada fila en su escala. */
.as-estanc-ej { margin-top: 6px; font: 400 14px/1.3 var(--texto); color: var(--as-tinta); }
.as-pesas { display: grid; gap: 13px; margin-top: 12px; }
.as-pesa { display: grid; grid-template-columns: minmax(0, 1fr) auto; row-gap: 5px; align-items: baseline; }
.as-pesa > span { font: 400 13px/1.2 var(--texto); color: var(--as-sub); }
.as-pesa > b { font: 400 12.5px/1.2 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.as-pesa.mayor > span { color: var(--as-tinta); }
.as-pesa-pista { position: relative; grid-column: 1 / 3; height: 12px; }
.as-pesa-pista > i { position: absolute; }
.as-pesa-base { left: 0; right: 0; top: 5.5px; height: 1px; background: var(--as-linea); }
.as-pesa-tramo { top: 5px; height: 2px; background: var(--as-apagado); }
.as-pesa.mayor .as-pesa-tramo { background: var(--as-claro); }
.as-pesa-con, .as-pesa-ahora { top: 1.5px; width: 9px; height: 9px; margin-left: -4.5px; box-sizing: border-box; border-radius: 50%; box-shadow: 0 0 0 2px var(--as-fondo); }
.as-pesa-con { background: var(--as-claro); }
.as-pesa-ahora { background: var(--as-fondo); border: 1.5px solid var(--as-principal); }
.as-causa { margin: 14px 0 0; font: 400 14.5px/1.3 var(--texto); color: var(--as-tinta); }
.as-frase { margin: 4px 0 0; font: 400 13.5px/1.38 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-juntando { display: grid; gap: 9px; margin-top: 14px; }
.as-juntando-fila { display: flex; align-items: center; justify-content: space-between; font: 400 13px/1 var(--texto); color: var(--as-sub); }
.as-cuadros { display: inline-flex; gap: 5px; }
.as-cuadros i { width: 11px; height: 11px; border: 1px solid var(--as-apagado); }
.as-cuadros i.lleno { background: var(--as-claro); border-color: var(--as-claro); }

/* Tu año: cifras chicas, sin caja. */
.as-anio-grilla { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 10px; margin-top: 12px; }
.as-dato { display: grid; gap: 4px; align-content: start; min-width: 0; }
.as-dato b { font: 300 21px/1 var(--numeros); letter-spacing: -0.01em; color: var(--as-tinta); font-variant-numeric: tabular-nums; white-space: nowrap; }
.as-dato span { font: 400 11px/1.25 var(--texto); color: var(--as-sub); }
.ascent:not(.vinculada) .as-dato b { color: var(--as-apagado); }
.as-pie { margin: 26px 0 0; font: 400 12px/1.4 var(--texto); color: var(--as-apagado); text-align: center; }

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
  .as-senal > svg:last-child, .as-senal.asoma, .as-asomo svg { animation: none; }
  .as-invita.entra, .as-contenido.as-entra, .as-hoja-form.as-entra, .as-parte.as-entra { animation-duration: 0.01s; }
  .as-chica-orbita, .as-chica-luna, .as-orbita, .as-luna, .as-luna-halo, .as-arriba .as-marca, .as-senal, .as-senal-pista { transition: none; }
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

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const A = Datos.ASCENT;
    const nombreDe = (v) => v[u.idioma()] || v.es;
    const curva = opciones.curva;
    const MAXIMOS = Entrenamiento.MAXIMOS_DE_RECUPERACION;
    const conNumeros = () => !tel.classList.contains('sin-numeros');
    const pct = (x) => `${x.toFixed(2)}%`;
    const redondo = (x) => u.conSigno(Math.round(x));
    let vinculada = false;
    // Cuánto subió: 0 es abajo, escondida; 1, arriba.
    let p = 0;
    let abierta = false;
    let animacion = 0;
    let comoSeCalcula = false;
    let comoRendimiento = false;
    // Cuánto se llegó al final de Progreso: de 0 a 1, y el planeta asoma con eso.
    let asomo = 0;
    // El día de ejemplo que se mira, y si ya se abrió alguna vez (la pista se va).
    let diaElegido = 'corta';
    let yaSeAbrio = false;
    const elDia = () => A.dias[diaElegido];

    const progresoZona = tel.querySelector('.progreso');
    const pgScroll = progresoZona.querySelector('.pg-scroll');
    const horizonte = el('div', 'as-horizonte');
    horizonte.innerHTML = '<i></i>';
    horizonte.setAttribute('aria-hidden', 'true');
    const velo = el('div', 'as-velo');
    const zona = el('section', 'ascent pagina-app');
    zona.setAttribute('aria-label', 'Ascent');
    zona.innerHTML = `<div class="as-scroll"><div class="as-arriba"></div><div class="as-contenido"></div></div>`;
    tel.append(velo, horizonte, zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.as-scroll');
    const contenido = zona.querySelector('.as-contenido');
    // La flecha para volver y el dibujo no se rearman: así el dibujo puede cambiar con una transición.
    const arriba = zona.querySelector('.as-arriba');
    const volver = boton('as-volver', icono('abajo'), () => cerrar());
    arriba.appendChild(volver);
    arriba.insertAdjacentHTML('beforeend', MARCA);
    const marca = arriba.querySelector('.as-marca');

    // La pestaña de Progreso, arriba de la barra: se toca o se desliza desde ella.
    const senal = boton('as-senal', `${MARCA_CHICA}<span class="as-senal-textos"><b class="as-senal-texto"></b><small class="as-senal-pista"></small></span>${icono('arriba')}`, () => abrir());
    progresoZona.appendChild(senal);
    const senalTexto = senal.querySelector('.as-senal-texto');
    const senalPista = senal.querySelector('.as-senal-pista');

    // ------------------------------------------------------------ lo que se calcula
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
    const sesionDe = (fecha) => A.sesiones.find((s) => s.fecha === fecha) || null;
    const sesionDeHoy = sesionDe(Datos.HOY);
    const inicioDeHoy = sesionDeHoy.inicio - sesionDeHoy.hora * 60e3;

    /** La recuperación de un día de ejemplo o, sin día, la de la persona de mentira (la que ve Sueño). */
    function calcularRecuperacion(d) {
      const anoche = d ? d.noche : opciones.anoche();
      if (d && !anoche) return null;
      const meta = opciones.metaBase();
      const ayer = opciones.comida.totalDe(-1);
      // Antes de entrenar hoy: el peso movido de los tres días anteriores, cuántos seguidos venía
      // entrenando y el promedio por día de las 4 semanas anteriores a esos tres días.
      const anteriores = [1, 2, 3].map((k) => sesionDe(Fechas.sumarDias(Datos.HOY, -k)));
      let seguidos = 0;
      while (seguidos < anteriores.length && anteriores[seguidos]) seguidos++;
      const historia = Entrenamiento.sesionesAnteriores(A.sesiones, Fechas.sumarDias(Datos.HOY, -3));
      const r = Entrenamiento.recuperacion({
        dormido: anoche ? anoche.dormido : 0, necesidad, calidad: anoche ? anoche.calidad : null, sentida: d ? null : opciones.cara(Datos.HOY),
        kilos3: anteriores.reduce((s, x) => s + (x ? x.kilos : 0), 0),
        kilosPorDia: historia.reduce((s, x) => s + x.kilos, 0) / (7 * Entrenamiento.SEMANAS_DE_HISTORIA),
        seguidos, proteinaAyer: ayer.p, metaProteina: meta.proteina, kcalAyer: ayer.kcal, metaKcal: meta.kcal,
      });
      return Object.assign(r, { anoche, ayer, meta });
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
      const lista = (titulo, cosas) => {
        cuerpo.appendChild(el('h4', 'as-hoja-grupo', titulo));
        const ul = el('ul', 'as-hoja-lista');
        cosas.forEach((c) => ul.appendChild(el('li', null, c)));
        cuerpo.appendChild(ul);
      };
      lista(tx('ascent.vincularHoja.deMoss'), tx('ascent.vincularHoja.mossComparte'));
      lista(tx('ascent.vincularHoja.deAscent'), tx('ascent.vincularHoja.ascentComparte'));
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

    // Cómo está Ascent en este iPhone cambia la señal y la invitación de Inicio.
    function ponerIphone(v) {
      esteIphone = v;
      document.querySelectorAll('#s-iphone button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === v)));
      pintarSenal();
      opciones.repintarInicio();
      opciones.repintarProgreso();
    }
    function ponerDia(v) {
      diaElegido = v;
      document.querySelectorAll('#s-dia-ascent button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === v)));
      comoSeCalcula = false;
      comoRendimiento = false;
      pintar();
      opciones.repintarProgreso();
      entraElContenido();
    }
    function entraElContenido() {
      contenido.classList.remove('as-entra');
      void contenido.offsetWidth;
      contenido.classList.add('as-entra');
    }
    // «Cómo se calcula» se despliega y se pliega: nada aparece ni desaparece de golpe.
    function desplegar(caja, abrirla) {
      caja.hidden = false;
      if (opciones.movimientoReducido) { caja.hidden = !abrirla; return; }
      const animacionDeCaja = caja.animate(
        [{ height: '0px', marginTop: '0px', opacity: 0 }, { height: `${caja.offsetHeight}px`, opacity: 1 }],
        { duration: 280, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', direction: abrirla ? 'normal' : 'reverse' },
      );
      if (!abrirla) animacionDeCaja.onfinish = () => { caja.hidden = true; };
    }

    // ------------------------------------------------------------ la señal de Progreso
    // Sin vincular invita, si Ascent está en este iPhone; vinculada, la última sesión; si no, la marca.
    function queDiceLaSenal() {
      const hoyHecha = elDia().sesion === 'hecha';
      const sesiones = A.sesiones.filter((s) => hoyHecha || s.fecha < Datos.HOY);
      return SenalDeAscent.senalDeAscent({ conAscent: true, vinculada, instalada: esteIphone !== 'sinAscent', sesiones, hoy: Datos.HOY });
    }
    function textoDeLaSenal() {
      const s = queDiceLaSenal();
      if (s.que !== 'sesion') return tx('ascent.senal.' + s.que);
      const sesion = nombreDe(sesionDe(s.fecha).nombre).toLowerCase();
      if (s.dias === 0) return tx('ascent.senal.hoy', { sesion });
      if (s.dias === 1) return tx('ascent.senal.ayer', { sesion });
      return tx('ascent.senal.dia', { dia: tx('fecha.dias.' + u.partes(s.fecha).dia), sesion });
    }
    function pintarSenal() {
      const texto = textoDeLaSenal();
      senal.classList.toggle('unida', vinculada);
      senal.classList.toggle('sin-pista', yaSeAbrio);
      senalPista.textContent = tx('ascent.senal.desliza');
      senal.setAttribute('aria-label', texto === tx('ascent.senal.marca') ? tx('ascent.flecha') : `${tx('ascent.flecha')}. ${texto}`);
      if (texto === senalTexto.textContent) return;
      // Cambia de ancho acomodándose y el texto entra con un fundido.
      const antes = senal.offsetWidth;
      const habia = senalTexto.textContent !== '';
      senalTexto.textContent = texto;
      if (!habia || opciones.movimientoReducido || !antes) return;
      senal.animate([{ width: `${antes}px` }, { width: `${senal.offsetWidth}px` }], { duration: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      senalTexto.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360 });
    }
    // La primera vez que se llega a Progreso, sube y baja apenas: de ahí se tira. Una sola vez.
    let yaAsomo = false;
    function asomar(otraVez) {
      if (yaAsomo && !otraVez) return;
      yaAsomo = true;
      if (otraVez) { yaSeAbrio = false; pintarSenal(); }
      senal.classList.remove('asoma');
      void senal.offsetWidth;
      senal.classList.add('asoma');
    }

    // Al final de Progreso, lo mismo que la pestaña, más grande, con el planeta asomando debajo.
    function asomoDeProgreso() {
      return boton('as-asomo', `${icono('arriba')}<b>${tx('ascent.asomo.titulo')}</b><span>${tx('ascent.asomo.texto')}</span>`, () => abrir());
    }
    function mirarElFinal() {
      const falta = pgScroll.scrollHeight - pgScroll.clientHeight - pgScroll.scrollTop;
      const enMetas = progresoZona.classList.contains('en-metas');
      asomo = enMetas ? 0 : clamp(1 - falta / 130, 0, 1);
      ponerHorizonte();
    }
    pgScroll.addEventListener('scroll', mirarElFinal, { passive: true });

    function ponerHorizonte() {
      const sube = ASOMA_PX * asomo + (HORIZONTE_PX - ASOMA_PX * asomo) * p;
      horizonte.style.setProperty('--sube', `${sube.toFixed(1)}px`);
      horizonte.style.setProperty('--escala', (0.8 + 0.2 * p).toFixed(3));
      horizonte.style.visibility = sube > 0.1 ? 'visible' : 'hidden';
      senal.style.opacity = ((1 - asomo) * (1 - Math.min(1, p * 2.5))).toFixed(3);
      senal.style.pointerEvents = asomo > 0.9 ? 'none' : '';
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
      const invita = SenalDeAscent.invitarEnInicio({ conAscent: true, listo: true, conCuenta: esteIphone !== 'sinCuenta', vinculada, instalada: esteIphone !== 'sinAscent', descartada });
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

    // ------------------------------------------------------------ rendimiento, músculos y marca
    // Como antes de entrenar hoy: 10 minutos antes de la sesión de piernas de las 18:40. Ya entrenado
    // o sin sesión, los músculos se miran ahora.
    const DIA = 86_400_000;
    const ANTES = sesionDeHoy.inicio - 10 * 60e3;
    const enLosMusculos = (d) => (!d || d.sesion === 'prevista' ? ANTES : inicioDeHoy + d.ahora * 60e3);
    const previas = (en = ANTES) => A.sesiones.filter((x) => x.inicio < en);
    const unoRM = (ejercicio, en = ANTES) => Musculos.mejorE1rm(previas(en), ejercicio);
    const GRUPOS = {
      piernas: ['cuadriceps', 'gluteos', 'isquios', 'aductores', 'pantorrillas'], espaldaBaja: ['espaldaBaja'], espalda: ['espaldaAlta'],
      pecho: ['pecho'], hombros: ['hombros'], brazos: ['biceps', 'triceps', 'antebrazos'], abdomen: ['abdomen'],
    };
    const grupoDe = (musculo) => Object.keys(GRUPOS).find((g) => GRUPOS[g].includes(musculo));
    const residualDe = (musculo, en = ANTES) => Musculos.residual(musculo, previas(en), en, { unoRM: (e) => unoRM(e, en) });

    /** Cada grupo, con el músculo que más le falta, su estado y en cuánto está listo. */
    function estadoDeGrupos(en = ANTES) {
      return Object.entries(GRUPOS).map(([grupo, musculos]) => {
        const peor = musculos.reduce((a, m) => (residualDe(m, en) > residualDe(a, en) ? m : a));
        const r = residualDe(peor, en);
        return { grupo, residual: r, estado: Musculos.estadoDe(r), listo: Musculos.listoEn(peor, previas(en), en, { unoRM: (e) => unoRM(e, en) }) };
      });
    }

    /** Las series de unos músculos (como principales) entre dos momentos. */
    function seriesDe(musculos, desde, hasta) {
      return A.sesiones.filter((x) => x.inicio >= desde && x.inicio < hasta).reduce((t, x) => {
        const d = Musculos.dosisDeLaSesion(x, unoRM);
        return t + musculos.reduce((u2, m) => u2 + ((d.get(m) && d.get(m).series) || 0), 0);
      }, 0);
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

    function calcularRendimiento(d) {
      const sesion = sesionDeHoy;
      const bloque = sesion.bloques[0];
      const musc = Musculos.musculosDe(bloque.ejercicio);
      const s = suenoParaElRendimiento(d);
      const residual = Math.max(...musc.principal.map((m) => residualDe(m)));
      // La semana contra el promedio de las cuatro anteriores, en series de los músculos principales.
      const semana = seriesDe(musc.principal, ANTES - 7 * DIA, ANTES);
      const mes = seriesDe(musc.principal, ANTES - 35 * DIA, ANTES - 7 * DIA) / 4;
      const conEllos = previas().filter((x) => musc.principal.some((m) => (Musculos.dosisDeLaSesion(x, unoRM).get(m) || {}).series > 0));
      const ultima = conEllos[conEllos.length - 1];
      const conElEjercicio = previas().filter((x) => x.bloques.some((b) => b.ejercicio === bloque.ejercicio));
      const ultimoDelEjercicio = conElEjercicio[conElEjercicio.length - 1];
      const ultimoBloque = ultimoDelEjercicio.bloques.find((b) => b.ejercicio === bloque.ejercicio);
      const ayer = opciones.comida.totalDe(-1);
      const meta = opciones.metaBase();
      const pesoKg = opciones.persona().pesoHoy || 75;
      const cambio = opciones.persona().cambio7;
      const entradas = {
        sueno: s.sueno, ultimas3: s.ultimas3, deuda: s.deuda, cara: s.cara,
        multiarticular: musc.multiarticular, tren: musc.principal.some((m) => Musculos.DE_PIERNAS.includes(m)) ? 'inferior' : 'superior', horaHabitual: sesion.hora,
        comida: {
          ayuno8h: false, sesionLarga: sesion.minutos > 45, carbosAyerPorKilo: ayer.c ? ayer.c / pesoKg : null, mismosMusculosAyer: false,
          bajaSemanal: cambio !== null && cambio !== undefined ? (-cambio / pesoKg) * 100 : null, semanasBajando: 6, kcalAyer: ayer.kcal ? ayer.kcal / meta.kcal : null,
        },
        residual,
        descarga: {
          diasSinSeriesDuras: Math.floor((ANTES - ultima.inicio) / DIA), seriesSemanaSobreMes: mes ? semana / mes : null,
          intensidadMantenida: ultimoBloque.series.some((x) => x.peso >= 0.85 * (unoRM(bloque.ejercicio) || Infinity)),
          diasSinElEjercicio: Math.floor((ANTES - ultimoDelEjercicio.inicio) / DIA),
        },
        entrenado: true,
      };
      return { r: Rendimiento.rendimientoEsperado(entradas), entradas, bloque, musc, anoche: s.anoche, ultima };
    }

    function calcularMarca(rend) {
      const { r, entradas, bloque, musc, ultima } = rend;
      const pr = A.marcas.find((m) => m.ejercicio === bloque.ejercicio);
      if (!pr) return null;
      const recientes = previas().filter((x) => x.inicio > ANTES - 21 * DIA);
      const dia = Rendimiento.buenDiaParaMarca({
        marca: Musculos.e1rm(pr.peso, pr.reps), mejorReciente: Musculos.mejorE1rm(recientes, bloque.ejercicio), marcaEn8Semanas: pr.fecha > Fechas.sumarDias(Datos.HOY, -56),
        recuperado: entradas.residual < 3, dormido: entradas.sueno ? entradas.sueno.dormido : null, despertoAntes: !!(entradas.sueno && entradas.sueno.despertoAntes),
        ultimas3: entradas.ultimas3, seriesSemanaSobreMes: entradas.descarga.seriesSemanaSobreMes, ayunoSesionLarga: entradas.comida.ayuno8h && entradas.comida.sesionLarga,
        bajandoRapido: entradas.comida.bajaSemanal !== null && entradas.comida.bajaSemanal > 1, deltaMax: r.max, sigma: r.sigma,
      });
      const av = A.avisos[bloque.ejercicio] || { veces: 0, marcas: 0, marcasEnTotal: 0, semanas: 0 };
      const seguridad = Rendimiento.seguridadDeMarcas({ marcas: av.marcasEnTotal, sesiones: previas().length, semanas: av.semanas, leGanaALaGeneral: false });
      return Object.assign(dia, { bloque, av, seguridad, grupo: grupoDe(musc.principal[0]), dias: Math.floor((ANTES - ultima.inicio) / DIA) });
    }

    // Lo de Moss de una semana, de lunes a domingo, con la comida y el sueño de la galería.
    function semanaDeMoss(desde) {
      const fechas = Array.from({ length: 7 }, (_, i) => Fechas.sumarDias(desde, i));
      const noches = Datos.NOCHES.filter((x) => fechas.includes(x.clave)).map((x) => x.dormido);
      const comidas = fechas.map((f) => opciones.comida.totalDe(Fechas.diasEntre(Datos.HOY, f))).filter((t) => t.kcal > 0).map((t) => ({ kcal: t.kcal, proteina: t.p }));
      return Entrenamiento.semanaDeMoss(noches, comidas, opciones.persona().gasto);
    }

    // Las semanas del estancamiento contra las semanas en que el ejercicio subía. Con «pocas
    // semanas» (un botón de la galería) solo hay dos con marcas: todavía está juntando.
    function porQueNoSube() {
      const e = A.estancado;
      const sin = Array.from({ length: e.semanas }, (_, i) => semanaDeMoss(Fechas.sumarDias(e.desde, 7 * i)));
      const con = opciones.pocasSemanas() ? A.semanasConMarcas.slice(0, 2) : A.semanasConMarcas;
      return Entrenamiento.porQueNoSube(con, sin);
    }

    // ------------------------------------------------------------ el diagnóstico
    /** Lo de hoy para las líneas de la comida y el diagnóstico: la meta del día, con o sin la sesión anotada. */
    function calcularDiagnostico(d) {
      const c = opciones.conAscent(d.sesion !== 'hecha');
      const meta = c ? c.meta : opciones.metaBase();
      const filas = Object.entries(d.anotado);
      const suma = (k) => filas.reduce((t, [, x]) => t + x[k], 0);
      const sesion = d.sesion ? { inicio: sesionDeHoy.hora, minutos: sesionDeHoy.minutos, tipo: 'fuerza', hecha: d.sesion === 'hecha' } : null;
      const rend = d.sesion && d.noche ? calcularRendimiento(d) : null;
      const m = rend ? calcularMarca(rend) : null;
      const diag = Diagnostico.diagnostico({
        contexto: {
          ahora: d.ahora, horaDeComida: HORA_DE_COMIDA, anotado: Object.fromEntries(filas.map(([k, x]) => [k, { hora: x.hora, proteina: x.p, kcal: x.kcal }])),
          meta: { kcal: meta.kcal, proteina: meta.proteina, carbohidratos: meta.carbohidratos, grasas: meta.grasas },
          comido: { kcal: suma('kcal'), proteina: suma('p'), carbohidratos: suma('c'), grasas: suma('g') },
          comidasHabituales: 4, pesoKg: Datos.PESADAS[Datos.PESADAS.length - 1].kg, edad: Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento,
          despertar: 7 * 60 + 30, dormir: 23 * 60 + 30, cafeinaPorToma: d.cafe || null, sinDeficit: !!(opciones.sinDeficit && opciones.sinDeficit()),
        },
        sesion, sabeCuandoEntrena: true,
        noche: d.noche ? { dormido: d.noche.dormido, necesidad, siesta: d.noche.siesta } : null,
        ultimas3: d.ultimas3, deuda: d.deuda, rendimiento: rend ? rend.r : null,
        marca: m && m.aplica ? nombreDelEjercicio(m.bloque.ejercicio) : null,
      });
      return { diag, rend, marca: m, meta };
    }
    const nombreDelEjercicio = (ej) => (A.nombresDeEjercicios[ej] ? nombreDe(A.nombresDeEjercicios[ej]) : ej.toLowerCase());

    function textoDelTitular(t) {
      if (t.que !== 'faltaProteina') return tx('ascent.diagnostico.titular.' + t.que);
      return conNumeros() ? tx('ascent.diagnostico.titular.faltaProteina', { g: numero(t.gramos) }) : tx('ascent.diagnostico.titular.faltaProteinaSinNumeros');
    }
    function textoDeMotivo(m, musc) {
      if (m.que === 'durmioPoco') return tx('ascent.rendimiento.motivos.durmioPoco', { horas: u.duracion(m.minutos) });
      if (m.que === 'musculoCargado') return tx('ascent.rendimiento.motivos.musculoCargado', { musculo: tx('ascent.musculos.grupos.' + grupoDe(musc.principal[0])) });
      if (m.que === 'sinEntrenarlo') return tx('ascent.rendimiento.motivos.sinEntrenarlo', { dias: m.dias });
      return tx('ascent.rendimiento.motivos.' + m.que);
    }
    function subDelTitular(d, resultado2) {
      const t = resultado2.diag.titular;
      if (t.que === 'faltaNoche' || t.que === 'sinHorario') return tx('ascent.diagnostico.sub.' + t.que);
      if (t.que === 'repeticiones') return tx('ascent.diagnostico.sub.repeticiones');
      if (t.que === 'cuesta' && resultado2.rend && resultado2.rend.r.vol < resultado2.rend.r.max - 1) return tx('ascent.diagnostico.sub.cuesta');
      if (t.que === 'descanso') {
        const grupos = estadoDeGrupos(enLosMusculos(d)).filter((g) => g.estado !== 'recuperado').sort((a, b) => b.residual - a.residual);
        return grupos.length ? tx('ascent.diagnostico.sub.recuperandose', { musculo: tx('ascent.musculos.grupos.' + grupos[0].grupo), h: grupos[0].listo }) : tx('ascent.diagnostico.sub.recuperados');
      }
      return '';
    }
    function textoDePaso(l) {
      const n = conNumeros();
      const c = n ? l.carbohidratos : null;
      const g = n ? l.proteina : null;
      const cuanto = c && g ? tx('entreno.cantidades', { c, p: g }) : g ? tx('entreno.soloProteina', { p: g }) : c ? tx('entreno.soloCarbohidratos', { c }) : '';
      const partes = [];
      if (l.clase === 'previa') partes.push(cuanto || tx('entreno.previaSinNumeros'));
      else if (l.clase === 'previaLiviana') partes.push(tx('ascent.diagnostico.pasos.liviana'), cuanto);
      else if (l.clase === 'snackPrevio') partes.push(c ? tx('entreno.snackPrevio', { c }) : tx('entreno.snackPrevioSinNumeros'));
      else if (l.clase === 'ayunasLarga') partes.push(c ? tx('entreno.ayunasLarga', { c }) : tx('entreno.ayunasLargaSinNumeros'));
      else if (l.clase === 'despues') partes.push(cuanto || tx('ascent.diagnostico.pasos.conProteina'));
      else if (l.clase === 'despuesPronto') partes.push(cuanto || tx('ascent.diagnostico.pasos.conProteina'), tx('ascent.diagnostico.pasos.pronto'));
      else if (l.clase === 'reponer') partes.push(tx('entreno.reponer', { hora: u.horaMin(l.hora) }), cuanto);
      else partes.push(g ? tx('entreno.antesDeDormir', { p: g }) : tx('entreno.antesDeDormirSinNumeros'));
      if (l.durantePorHora) partes.push(n ? tx('entreno.durante', { a: l.durantePorHora[0], b: l.durantePorHora[1] }) : tx('entreno.duranteSinNumeros'));
      if (l.cafeinaHasta != null) partes.push(tx('entreno.cafeina', { hora: u.horaMin(l.cafeinaHasta) }));
      return partes.filter(Boolean).join(' ');
    }
    function textoDeConsejo(c) {
      if (c.que === 'marca') return tx('ascent.diagnostico.consejos.marca', { ejercicio: c.ejercicio });
      if (c.que === 'totalDelDia') return conNumeros() ? tx('ascent.diagnostico.consejos.totalDelDia', { g: numero(c.gramos) }) : tx('ascent.diagnostico.consejos.totalDelDiaSinNumeros');
      return tx('ascent.diagnostico.consejos.' + c.que);
    }

    // Las comidas del día, la sesión y ahora sobre una línea: lo de antes y lo de después se ve de un vistazo.
    function lineaDelDia(d, diag) {
      const DESDE = 6 * 60, HASTA = 24 * 60;
      const x = (m) => pct(((m - DESDE) / (HASTA - DESDE)) * 100);
      const c = el('div', 'as-dia');
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', tx('ascent.diagnostico.lineaDelDia'));
      c.appendChild(el('i', 'as-dia-base'));
      const marcadas = new Set(diag.pasos.map((q) => q.linea.comida));
      Object.keys(HORA_DE_COMIDA).forEach((k) => {
        const anotada = d.anotado[k];
        const n = el('div', 'as-dia-comida' + (anotada ? ' anotada' : '') + (marcadas.has(k) ? ' marcada' : ''));
        n.style.left = x(anotada ? anotada.hora : HORA_DE_COMIDA[k]);
        n.append(el('span', null, tx('comida.comidas.' + k)), el('i'));
        c.appendChild(n);
      });
      if (d.sesion) {
        const fin = sesionDeHoy.hora + sesionDeHoy.minutos;
        if (d.ahora > sesionDeHoy.hora - 120 && d.ahora < fin + 120) c.classList.add(d.ahora < sesionDeHoy.hora ? 'ahora-antes' : 'ahora-despues');
        const s = el('div', 'as-dia-sesion');
        s.style.left = x(sesionDeHoy.hora);
        s.style.width = pct((sesionDeHoy.minutos / (HASTA - DESDE)) * 100);
        s.appendChild(el('span', null, nombreDe(sesionDeHoy.nombre)));
        c.appendChild(s);
      }
      const a = el('div', 'as-dia-ahora');
      a.style.left = x(d.ahora);
      a.appendChild(el('span', null, tx('ascent.diagnostico.ahora')));
      c.appendChild(a);
      return c;
    }

    // ------------------------------------------------------------ las partes
    const grupo = (clave) => el('h3', 'as-grupo', tx('ascent.' + clave));
    const candado = () => {
      const c = el('span', 'as-candado');
      c.innerHTML = icono('candado');
      c.appendChild(el('span', null, tx('ascent.conAscent')));
      return c;
    };
    function parte(clase, titulo, derecha) {
      const c = el('article', 'as-parte ' + clase);
      const cab = el('header', 'as-parte-cab');
      cab.appendChild(el('h4', 'as-etq', titulo));
      if (derecha) cab.appendChild(derecha);
      c.appendChild(cab);
      return c;
    }
    const una = (clave) => el('p', 'as-una', tx('ascent.graficos.' + clave));

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

    // El número grande con su barra: sueño, carga y comida, cada uno del tamaño de lo que pesa.
    function segmentos(rec) {
      const c = el('div', 'as-segmentos');
      PARTES.forEach((k) => {
        const s = el('div', 'as-segmento');
        const pista = el('i');
        const relleno = el('i');
        relleno.style.width = rec ? pct((rec.partes[k] / MAXIMOS[k]) * 100) : '0';
        pista.appendChild(relleno);
        const nombre = el('span', null, tx('ascent.recuperacion.partes.' + k));
        nombre.appendChild(el('b', null, rec ? String(rec.partes[k]) : '—'));
        s.append(pista, nombre);
        c.appendChild(s);
      });
      return c;
    }

    function figuras(d, diag) {
      const c = el('div', 'as-figuras');
      const figura = (valor, nombre) => { const f = el('div', 'as-figura'); f.append(el('b', null, valor), el('span', null, nombre)); return f; };
      c.appendChild(d.noche ? figura(u.duracion(d.noche.dormido), tx('ascent.diagnostico.figuras.dormiste')) : figura('—', tx('ascent.diagnostico.figuras.sinNoche')));
      if (conNumeros()) {
        c.appendChild(diag.proteina
          ? figura(`${numero(Math.round(diag.proteina.comido))} g`, tx('ascent.diagnostico.figuras.proteina', { meta: numero(diag.proteina.meta) }))
          : figura('—', tx('ascent.diagnostico.figuras.sinComida')));
      }
      if (d.sesion) c.appendChild(figura(u.horaMin(sesionDeHoy.hora), d.sesion === 'hecha' ? tx('ascent.diagnostico.figuras.hecho', { nombre: nombreDe(sesionDeHoy.nombre) }) : nombreDe(sesionDeHoy.nombre)));
      else c.appendChild(figura('—', tx('ascent.diagnostico.figuras.descanso')));
      return c;
    }

    // Lo primero de la sección: el número, cómo vienes y qué hacer. Con «sin déficit», solo el número.
    function parteDiagnostico() {
      const d = elDia();
      const rec = calcularRecuperacion(d);
      const r = calcularDiagnostico(d);
      const c = el('section', 'as-diag');
      c.appendChild(el('span', 'as-etq', tx('ascent.diagnostico.etiqueta')));
      c.appendChild(el('div', 'as-cifra' + (rec ? '' : ' vacia'), rec ? String(rec.total) : '—'));
      const pie = el('div', 'as-cifra-pie');
      pie.appendChild(el('span', null, tx('ascent.diagnostico.deCien')));
      // Si conviene ir fuerte o suave es para antes de entrenar.
      if (rec && d.sesion === 'prevista') pie.appendChild(el('b', null, tx('ascent.recuperacion.conviene.' + rec.conviene)));
      c.append(pie, segmentos(rec));
      if (rec) {
        const caja = el('p', 'as-explicacion', tx('ascent.recuperacion.explicacion'));
        caja.hidden = !comoSeCalcula;
        const b = boton('as-enlace', tx('progreso.comoSeCalcula'), () => {
          comoSeCalcula = !comoSeCalcula;
          desplegar(caja, comoSeCalcula);
        });
        c.append(b, caja);
      }
      if (!r.diag) return c;
      c.appendChild(el('h3', 'as-titular', textoDelTitular(r.diag.titular)));
      const sub = subDelTitular(d, r);
      if (sub) c.appendChild(el('p', 'as-sub', sub));
      const irA = (f) => boton('as-enlace', tx('ascent.diagnostico.irA.' + f), () => opciones.irASeccion(f));
      const yaDicho = { faltaNoche: 'sueno', sinHorario: 'sesion' }[r.diag.titular.que];
      if (yaDicho) c.appendChild(irA(yaDicho));
      if (r.rend && d.sesion === 'prevista') {
        const motivos = r.rend.r.motivos.filter((m) => m.que !== 'durmioPoco').slice(0, 2).map((m) => textoDeMotivo(m, r.rend.musc));
        if (motivos.length) c.appendChild(el('p', 'as-nota', motivos.join(' · ')));
      }
      c.appendChild(figuras(d, r.diag));
      c.appendChild(lineaDelDia(d, r.diag));
      if (r.diag.pasos.length) {
        const pasos = el('div', 'as-pasos');
        r.diag.pasos.forEach((q) => {
          const f = el('div', 'as-paso');
          const cab = el('header');
          cab.append(el('span', 'as-etq', tx('ascent.diagnostico.cuando.' + q.cuando)), el('b', null, q.linea.comida === 'snack' ? tx('comida.comidas.snack') : `${tx('comida.comidas.' + q.linea.comida)} · ${u.horaMin((d.anotado[q.linea.comida] || {}).hora ?? HORA_DE_COMIDA[q.linea.comida])}`));
          f.append(cab, el('p', null, textoDePaso(q.linea)));
          pasos.appendChild(f);
        });
        c.appendChild(pasos);
      }
      if (r.diag.consejos.length) {
        c.appendChild(el('h4', 'as-etq as-para-hoy', tx('ascent.diagnostico.paraHoy')));
        const lista = el('ul', 'as-consejos');
        r.diag.consejos.forEach((k) => lista.appendChild(el('li', null, textoDeConsejo(k))));
        c.appendChild(lista);
      }
      r.diag.faltan.filter((f) => f !== yaDicho).forEach((f) => {
        const fila = el('div', 'as-falta');
        fila.append(el('span', null, tx('ascent.diagnostico.faltan.' + f)), irA(f));
        c.appendChild(fila);
      });
      return c;
    }

    // Sin vincular: lo mismo, vacío.
    function parteDiagnosticoVacia() {
      const c = parte('as-diagnostico', tx('ascent.diagnostico.etiqueta'), candado());
      c.append(una('diagnostico'), segmentos(null));
      return c;
    }

    // Hoy en Ascent: la sesión, la meta de hoy con el reparto de la semana, y la proteína de la sesión.
    function parteHoy(d) {
      const c = opciones.conAscent(d.sesion !== 'hecha');
      if (!c) return null;
      const hecha = d.sesion === 'hecha', prevista = d.sesion === 'prevista';
      const k = parte('as-hoy', tx('ascent.hoy.titulo'), hecha || prevista ? el('span', 'as-derecha', tx('ascent.hoy.aLas', { hora: u.horaMin(sesionDeHoy.hora) })) : null);
      const nombre = nombreDe(sesionDeHoy.nombre);
      const linea = hecha ? tx('ascent.hoy.sesion', { nombre, min: sesionDeHoy.minutos, series: sesionDeHoy.series })
        : prevista ? tx('ascent.rendimiento.previsto', { sesion: nombre, dia: tx('fecha.dias.' + u.partes(Datos.HOY).dia) }) : tx('ascent.hoy.descanso');
      k.appendChild(el('div', 'as-hoy-sesion', linea));
      if (conNumeros()) k.appendChild(el('p', 'as-hoy-meta', tx('ascent.hoy.meta', { kcal: numero(c.meta.kcal), p: numero(c.meta.proteina) })));
      // La semana del control: los días de gimnasio más altos, los de descanso más bajos y lo que
      // viene como previsión. Suma lo mismo que el control.
      const barras = el('div', 'as-semana');
      const valores = c.semana.map((x) => x.meta.kcal);
      const alto = Math.max(...valores), bajo = Math.min(...valores);
      c.semana.forEach((x) => {
        const esHoy = x.fecha === Datos.HOY;
        const clase = esHoy && prevista ? ' previsto' : x.entrena === true ? ' gimnasio' : x.entrena === null ? ' previsto' : '';
        const col = el('div', 'as-semana-dia' + clase + (esHoy ? ' hoy' : ''));
        const barra = el('i');
        barra.style.height = `${(20 + (38 * (x.meta.kcal - bajo)) / Math.max(1, alto - bajo)).toFixed(1)}px`;
        if (esHoy && conNumeros()) col.appendChild(el('b', null, numero(x.meta.kcal)));
        col.append(barra, el('span', null, tx('fecha.diasCortos.' + Fechas.diaDeLaSemana(x.fecha)).charAt(0)));
        barras.appendChild(col);
      });
      const leyenda = el('div', 'as-leyenda');
      ['gimnasio', 'descanso', 'previsto'].forEach((n) => leyenda.appendChild(el('span', 'as-leyenda-' + n, tx('ascent.hoy.leyenda.' + n))));
      k.append(barras, leyenda, una('semana'));
      if (hecha && c.extra > 0) {
        const n = Math.round(Math.abs(c.tamano - 1) * 100);
        const comparacion = n < 5 ? tx('ascent.hoy.comparacion.comoSiempre') : tx('ascent.hoy.comparacion.' + (c.tamano > 1 ? 'masGrande' : 'masChica'), { n });
        k.appendChild(el('p', 'as-nota', tx('ascent.hoy.proteina.sube', { p: c.extra, comparacion })));
      }
      return k;
    }

    // El gimnasio se enciende solo: un hábito con la fuente «Ascent», como los de Salud. Si no hay
    // ninguno, se suma acá con un toque (los días, los que suele entrenar); en la galería solo cambia
    // la parte.
    let conGimnasio = false;
    function parteGimnasio() {
      const c = parte('as-gimnasio', tx('ascent.funciones.gimnasio.titulo'));
      const nombre = tx('ascent.gimnasio.nombre');
      if (conGimnasio) {
        c.appendChild(el('p', 'as-una', tx('ascent.gimnasio.listo', { nombre })));
        return c;
      }
      c.appendChild(el('p', 'as-una', tx('ascent.gimnasio.sumar', { nombre })));
      c.appendChild(boton('as-hoja-entrar as-gimnasio-sumar', `<span>${tx('ascent.gimnasio.boton', { nombre })}</span>`, () => {
        conGimnasio = true;
        const nueva = parteGimnasio();
        nueva.classList.add('as-entra');
        c.replaceWith(nueva);
      }));
      return c;
    }

    // El rendimiento esperado: cada número sobre su escala, con lo tuyo marcado, lo normal y el margen.
    function escala(valor, sigma) {
      const [a, b] = ESCALA;
      const x = (v) => ((clamp(v, a, b) - a) / (b - a)) * 100;
      const c = el('div', 'as-escala');
      const normal = el('i', 'as-escala-normal');
      normal.style.left = pct(x(-1.5));
      normal.style.width = pct(x(1.5) - x(-1.5));
      const cero = el('i', 'as-escala-cero');
      cero.style.left = pct(x(0));
      c.append(el('i', 'as-escala-base'), normal, cero);
      if (valor !== null) {
        const margen = el('i', 'as-escala-margen');
        margen.style.left = pct(x(valor - sigma));
        margen.style.width = pct(x(valor + sigma) - x(valor - sigma));
        const punto = el('i', 'as-escala-punto');
        punto.style.left = pct(x(valor));
        c.append(margen, punto);
      }
      return c;
    }
    function ejeDeLaEscala() {
      const [a, b] = ESCALA;
      const c = el('div', 'as-escala-eje');
      const cero = el('span', null, tx('ascent.graficos.loTuyo'));
      cero.style.left = pct(((0 - a) / (b - a)) * 100);
      c.append(el('span', null, `${u.conSigno(a)} %`), cero, el('span', null, `${u.conSigno(b)} %`));
      return c;
    }
    function parteRendimiento(d) {
      const conDatos = vinculada && d.sesion && d.noche;
      const rend = conDatos ? calcularRendimiento(d) : null;
      const c = parte('as-rendimiento', tx('ascent.rendimiento.titulo'), rend ? el('span', 'as-derecha', tx('ascent.rendimiento.hoy', { sesion: nombreDe(sesionDeHoy.nombre) })) : vinculada ? null : candado());
      if (vinculada && !d.sesion) {
        c.appendChild(el('p', 'as-una', tx('ascent.graficos.rendimientoDescanso')));
        return c;
      }
      c.appendChild(una('rendimiento'));
      [['fuerza', rend ? rend.r.max : null, rend ? rend.r.categoria.max : null], ['repeticiones', rend ? rend.r.vol : null, rend ? rend.r.categoria.vol : null]].forEach(([k, v, cat]) => {
        const f = el('div', 'as-rend-fila');
        const cab = el('div', 'as-rend-cab');
        cab.append(el('span', null, tx('ascent.rendimiento.' + k)), el('b', null, v === null ? '—' : `${tx('ascent.rendimiento.categorias.' + cat)} · ${redondo(v)} %`));
        f.append(cab, escala(v, rend ? rend.r.sigma : 0));
        c.appendChild(f);
      });
      c.appendChild(ejeDeLaEscala());
      if (!rend) {
        if (vinculada) c.appendChild(el('p', 'as-nota', tx('ascent.diagnostico.faltan.sueno')));
        return c;
      }
      const motivos = el('ul', 'as-motivos');
      (rend.r.motivos.length ? rend.r.motivos.slice(0, 3).map((m) => textoDeMotivo(m, rend.musc)) : [tx('ascent.rendimiento.sinMotivos')]).forEach((texto) => motivos.appendChild(el('li', null, texto)));
      c.append(el('p', 'as-nota', tx('ascent.graficos.margen', { n: numero(rend.r.sigma, 1) })), motivos);
      const caja = el('div', 'as-explicacion');
      tx('ascent.rendimiento.como').forEach((x) => caja.appendChild(el('p', null, x)));
      caja.hidden = !comoRendimiento;
      const b = boton('as-enlace', tx('progreso.comoSeCalcula'), () => {
        comoRendimiento = !comoRendimiento;
        desplegar(caja, comoRendimiento);
      });
      c.append(b, caja);
      return c;
    }

    // Los músculos: lo que le falta a cada uno, y en palabras (nunca solo con color).
    function parteMusculos(d) {
      const c = parte('as-musculos', tx('ascent.musculos.titulo'), vinculada ? null : candado());
      c.appendChild(una('musculos'));
      const eje = el('div', 'as-musc-eje');
      [3, 10].forEach((n) => { const s = el('span', null, `${n} %`); s.style.left = pct((n / TOPE_MUSCULO) * 100); eje.appendChild(s); });
      c.appendChild(eje);
      const lista = el('ul', 'as-musculos-lista');
      const grupos = vinculada ? estadoDeGrupos(enLosMusculos(d)) : Object.keys(GRUPOS).map((g) => ({ grupo: g, residual: 0, estado: null, listo: null }));
      grupos.forEach((g) => {
        const li = el('li', 'as-musc ' + (g.estado || ''));
        const barra = el('div', 'as-musc-barra');
        const relleno = el('i');
        relleno.style.width = pct((clamp(g.residual, 0, TOPE_MUSCULO) / TOPE_MUSCULO) * 100);
        barra.appendChild(relleno);
        const estado = el('div', 'as-musc-estado');
        estado.appendChild(el('b', null, g.estado ? tx('ascent.musculos.estados.' + g.estado) : '—'));
        if (g.listo) estado.appendChild(el('small', null, tx('ascent.musculos.listoEn', { h: g.listo })));
        li.append(el('span', 'as-musc-nombre', tx('ascent.musculos.grupos.' + g.grupo)), barra, estado);
        lista.appendChild(li);
      });
      c.appendChild(lista);
      if (vinculada) c.appendChild(el('p', 'as-nota', tx('ascent.musculos.nota')));
      return c;
    }

    // «Buen día para intentar marca»: las cinco condiciones y la probabilidad contra el 35 % que hace falta.
    function medidor(prob) {
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
      const eje = el('div', 'as-medidor-eje');
      const avisa = el('span', null, tx('ascent.marca.avisaDesde', { p: Math.round(Rendimiento.AVISAR_DESDE * 100) }));
      avisa.style.left = pct(x(Rendimiento.AVISAR_DESDE));
      eje.appendChild(avisa);
      c.append(m, eje);
      return c;
    }
    function parteMarca(d) {
      const rend = vinculada && d.sesion === 'prevista' && d.noche ? calcularRendimiento(d) : null;
      const m = rend ? calcularMarca(rend) : null;
      const c = parte('as-pr', tx('ascent.marca.titulo'), vinculada ? null : candado());
      // Sin una sesión por delante, o sin la noche, no hay nada que medir.
      if (vinculada && !m) {
        c.appendChild(el('p', 'as-una', tx('ascent.marca.hoyNo')));
        return c;
      }
      if (m) c.appendChild(el('p', 'as-pr-titulo', m.aplica ? tx('ascent.marca.en', { ejercicio: nombreDelEjercicio(m.bloque.ejercicio) }) : tx('ascent.marca.hoyNoCorto', { ejercicio: nombreDelEjercicio(m.bloque.ejercicio) })));
      c.appendChild(una('marca'));
      const lista = el('ul', 'as-condiciones');
      ['cerca', 'recuperado', 'sueno', 'sinPico', 'comida'].forEach((k) => {
        const si = !!(m && m.condiciones[k]);
        const li = el('li', 'as-condicion ' + (m ? (si ? 'si' : 'no') : ''));
        const marcaDe = el('i');
        marcaDe.innerHTML = icono('listo');
        li.append(marcaDe, el('span', null, tx('ascent.marca.condiciones.' + k)));
        lista.appendChild(li);
      });
      c.append(lista, medidor(m ? m.probabilidad : null));
      if (m) {
        const cab = el('p', 'as-nota', `${tx('ascent.marca.probabilidad', { p: Math.round(m.probabilidad * 100) })} · ${tx('ascent.marca.seguridad', { nivel: tx('ascent.rendimiento.niveles.' + m.seguridad), marcas: m.av.marcasEnTotal, semanas: m.av.semanas })}`);
        c.appendChild(cab);
        c.appendChild(el('p', 'as-nota', tx('ascent.marca.nota')));
      }
      return c;
    }

    // Por qué no subes: dos puntos por fila, cada una en su escala, y la fila que más cambió resaltada.
    function pesas(antes, ahora, causa) {
      const c = el('div', 'as-pesas');
      const valor = {
        sueno: (v) => u.duracion(Math.round(v)),
        proteina: (v) => tx('ascent.estancamiento.gramos', { n: numero(Math.round(v)) }),
        calorias: (v) => tx('ascent.estancamiento.kcal', { n: u.conSigno(Math.round(v / 10) * 10) }),
      };
      [['sueno', 'sueno'], ['proteina', 'proteina'], ['calorias', 'balance']].forEach(([k, campo]) => {
        const f = el('div', 'as-pesa' + (k === causa ? ' mayor' : ''));
        const hay = antes && ahora;
        f.append(el('span', null, tx('ascent.estancamiento.filas.' + k)), el('b', null, hay ? `${valor[k](antes[campo])} → ${valor[k](ahora[campo])}` : '—'));
        const pista = el('div', 'as-pesa-pista');
        pista.appendChild(el('i', 'as-pesa-base'));
        if (hay) {
          // Cada escala de diferencia ocupa un cuarto del ancho: una distancia larga es una diferencia grande.
          const dif = (antes[campo] - ahora[campo]) / ESCALAS[k];
          const media = 50;
          const xCon = clamp(media + dif * 12.5, 4, 96);
          const xAhora = clamp(media - dif * 12.5, 4, 96);
          const tramo = el('i', 'as-pesa-tramo');
          tramo.style.left = pct(Math.min(xCon, xAhora));
          tramo.style.width = pct(Math.abs(xCon - xAhora));
          const con = el('i', 'as-pesa-con');
          con.style.left = pct(xCon);
          const ya = el('i', 'as-pesa-ahora');
          ya.style.left = pct(xAhora);
          pista.append(tramo, con, ya);
        }
        f.appendChild(pista);
        c.appendChild(f);
      });
      return c;
    }
    function parteEstancamiento() {
      const c = parte('as-estanc', tx('ascent.estancamiento.titulo'), vinculada ? null : candado());
      const e = A.estancado;
      const leyenda = () => {
        const l = el('div', 'as-leyenda');
        l.append(el('span', 'as-leyenda-con', tx('ascent.estancamiento.conMarcas')), el('span', 'as-leyenda-ahora', tx('ascent.estancamiento.ahora', { n: e.semanas })));
        return l;
      };
      if (!vinculada) {
        c.append(una('estancamiento'), pesas(null, null, null));
        return c;
      }
      c.appendChild(el('div', 'as-estanc-ej', tx('ascent.estancamiento.ejercicio', { ejercicio: nombreDe(e.ejercicio), semanas: e.semanas, marca: e.marca })));
      const r = porQueNoSube();
      if (r.estado === 'juntando') {
        // Las semanas que ya hay, de las que hacen falta de cada lado.
        const juntadas = el('div', 'as-juntando');
        [['conMarcas', r.conMarcas], ['sinMarcas', r.sinMarcas]].forEach(([clave, n]) => {
          const fila = el('div', 'as-juntando-fila');
          fila.appendChild(el('span', null, tx('ascent.estancamiento.' + clave)));
          const cuadros = el('span', 'as-cuadros');
          for (let i = 0; i < Entrenamiento.SEMANAS_MINIMAS; i++) cuadros.appendChild(el('i', i < n ? 'lleno' : null));
          fila.appendChild(cuadros);
          juntadas.appendChild(fila);
        });
        c.append(el('p', 'as-frase', tx('ascent.estancamiento.juntando')), juntadas);
        return c;
      }
      c.append(una('estancamiento'), leyenda(), pesas(r.antes, r.ahora, r.estado === 'probable' ? r.causa : null));
      if (r.estado === 'probable') {
        const horas = u.duracion(Math.floor(r.antes.sueno / 15) * 15);
        c.append(
          el('p', 'as-causa', tx('ascent.estancamiento.causa', { causa: tx('ascent.estancamiento.causas.' + r.causa) })),
          el('p', 'as-frase', tx('ascent.estancamiento.frases.' + r.causa, { horas })),
          el('p', 'as-nota', tx('ascent.estancamiento.nota')),
        );
      } else {
        c.appendChild(el('p', 'as-frase', tx('ascent.estancamiento.sinDiferencia')));
      }
      return c;
    }

    function parteAnio() {
      const c = parte('as-anio', tx('ascent.anio.titulo'), vinculada ? el('span', 'as-derecha', tx('ascent.anio.cuando')) : candado());
      if (!vinculada) c.appendChild(una('anio'));
      const noches = Datos.NOCHES;
      const sueno = noches.reduce((s, x) => s + x.dormido, 0) / Math.max(1, noches.length);
      const datos = [
        ['entrenamientos', numero(A.anio.entrenamientos)],
        ['marcas', numero(A.anio.marcas)],
        ['habitos', numero(A.anio.diasConHabitos)],
        ['sueno', tx('ascent.anio.horas', { h: Math.floor(sueno / 60), m: String(Math.round(sueno % 60)).padStart(2, '0') })],
        ['comida', numero(A.anio.diasConComida)],
      ];
      const grilla = el('div', 'as-anio-grilla');
      datos.forEach(([k, v]) => {
        const d = el('div', 'as-dato');
        d.append(el('b', null, vinculada ? v : '—'), el('span', null, tx('ascent.anio.datos.' + k)));
        grilla.appendChild(d);
      });
      c.appendChild(grilla);
      return c;
    }

    function pintar() {
      const scroll = cont.scrollTop;
      contenido.innerHTML = '';
      zona.classList.toggle('vinculada', vinculada);
      volver.setAttribute('aria-label', tx('ascent.volverAProgreso'));
      pintarSenal();
      const d = elDia();
      if (vinculada) {
        contenido.append(...[parteDiagnostico(), parteHoy(d), parteRendimiento(d), parteMusculos(d), parteMarca(d), parteEstancamiento(), parteGimnasio(), parteAnio()].filter(Boolean));
        contenido.appendChild(el('p', 'as-pie', tx('ascent.desvincular')));
      } else {
        contenido.append(cabezaSinVincular(), grupo('soloConLasDos'), parteDiagnosticoVacia(), parteRendimiento(d), parteMusculos(d), parteMarca(d), parteEstancamiento(), parteAnio());
      }
      cont.scrollTop = scroll;
    }

    // ------------------------------------------------------------ subir y bajar
    function poner(v) {
      p = clamp(v, 0, 1);
      zona.style.transform = `translate3d(0, ${((1 - p) * 100).toFixed(3)}%, 0)`;
      zona.style.visibility = p > 0.0005 ? 'visible' : 'hidden';
      zona.inert = p === 0;
      velo.style.opacity = (0.32 * p).toFixed(3);
      ponerHorizonte();
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
      if (!abierta) { cont.scrollTop = 0; comoSeCalcula = false; }
      if (abierta && !yaSeAbrio) { yaSeAbrio = true; pintarSenal(); }
      if (opciones.alCambiar) opciones.alCambiar();
    }
    function abrir(deUna) { if (!abierta) pintar(); ir(1, deUna); }
    function cerrar(deUna) { ir(0, deUna); }

    // Para volver: deslizar para abajo desde arriba de todo, o con la flecha.
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
        if (cont.scrollTop > 0 || dy < -8 || Math.abs(dx) > 12) { tirando = null; return; }
        if (dy < 10 || Math.abs(dx) > dy) return;
        g.decidido = true;
        try { zona.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual funciona */ }
      }
      ev.preventDefault();
      const ahora = performance.now();
      g.v = g.v * 0.6 + ((ev.clientY - g.ultimoY) / Math.max(1, ahora - g.ultimoT)) * 0.4;
      g.ultimoY = ev.clientY;
      g.ultimoT = ahora;
      poner(1 - Math.max(0, dy - 10) / (zona.clientHeight || 1));
    });
    const soltar = (ev) => {
      const g = tirando;
      if (!g || ev.pointerId !== g.id) return;
      tirando = null;
      if (!g.decidido) return;
      const baja = ev.type === 'pointerup' && (1 - p >= 0.2 || g.v >= 0.35);
      ir(baja ? 0 : 1);
      // El click que llega después de arrastrar no es un toque.
      const tragar = (e) => { e.stopPropagation(); e.preventDefault(); };
      zona.addEventListener('click', tragar, { capture: true, once: true });
      setTimeout(() => zona.removeEventListener('click', tragar, { capture: true }), 400);
    };
    zona.addEventListener('pointerup', soltar);
    zona.addEventListener('pointercancel', soltar);
    // En Safari del iPhone, arriba de todo, tirar para abajo es de la sección y no del scroll.
    let toque = null;
    cont.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; toque = t ? { x: t.clientX, y: t.clientY, arriba: cont.scrollTop <= 0 } : null; }, { passive: true });
    cont.addEventListener('touchmove', (ev) => {
      const t = ev.touches[0];
      if (!toque || !t || !toque.arriba) return;
      const dy = t.clientY - toque.y;
      if (dy > 0 && dy > Math.abs(t.clientX - toque.x)) ev.preventDefault();
    }, { passive: false });

    poner(0);
    pintar();

    return {
      zona,
      senal,
      asomar,
      invitacion,
      asomoDeProgreso,
      mirarElFinal,
      ponerIphone,
      ponerDia,
      // Mientras se desliza entre pestañas, el planeta que asoma se va con Progreso.
      seguirPagina(x) { horizonte.style.translate = `${x.toFixed(1)}px 0`; },
      // Para los botones de la galería: «Ahora no» se olvida al recargar o con esto.
      volverAInvitar() { descartada = false; opciones.repintarInicio(); },
      pintar,
      abrir,
      cerrar,
      get vinculada() { return vinculada; },
      get abierta() { return abierta; },
      get progreso() { return p; },
      // Ocupada: arriba, subiendo o bajando. Mientras, las pestañas no se deslizan.
      get ocupada() { return abierta || p > 0 || !!animacion; },
      // El gesto desde Progreso (galeria.js): mientras el dedo sube, y al soltar.
      arrastrar(fr) { cancelAnimationFrame(animacion); animacion = 0; if (!abierta && p === 0) pintar(); poner(fr); },
      soltar(subir) { ir(subir ? 1 : 0); },
      ponerVinculo(si) {
        vinculada = si;
        marca.classList.toggle('unida', si);
        if (si) quitarInvitacion();
        opciones.repintarInicio();
        opciones.repintarProgreso();
        pintar();
        entraElContenido();
      },
      // La recuperación de hoy, para Sueño: la de la persona de mentira, no la del día de ejemplo.
      recuperacionDeHoy: () => (vinculada ? calcularRecuperacion() : null),
      // Para las capturas: la hoja de vincular.
      abrirVincular,
      get hojaVincularAbierta() { return hojaVincular.abierta; },
      cerrarVincular() { clearTimeout(esperaDeLaHoja); hojaVincular.cerrar(true); },
      // La línea del rendimiento en Sueño.
      rendimientoDeHoy: () => (vinculada ? calcularRendimiento().r : null),
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTop = Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 60);
      },
      subir() { cont.scrollTop = 0; },
    };
  }

  return { crear };
})();
