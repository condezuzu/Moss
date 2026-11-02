// Sueño (spec/sueno.md): lo que Salud trae de cada noche, armado con las reglas de la app (Sueno,
// src/dominio/sueno.ts) y, sin reloj, las noches que Moss estima con el teléfono (SinReloj,
// src/dominio/sinReloj.ts). Arriba, la pregunta de cada mañana (sin reloj, primero la hora si Moss
// no está segura; después cómo dormiste, con cinco caras) y las
// últimas dos semanas para elegir una noche; después, esa noche en un arco (cuánto dormiste, cuándo,
// las etapas como estimación, lo despierto), la deuda con su medidor y lo que sumó cada noche, que es
// lo que más gente puede tener bien, su calidad en un anillo con de qué sale, el horario y qué tan
// regular es, lo que mide el reloj de noche con su línea, y de dónde sale cada dato y qué tan
// confiable es. Lo que falta se muestra como falta: nunca se inventa.
// La propuesta para aprobar (más color, azul y un poco de verde): sin noches, una invitación concreta,
// un ejemplo marcado como ejemplo y cuánto falta para cada cosa; con pocas, lo que ya hay y los puntos.

const SeccionSueno = (() => {
  const DIAS = 14;
  // La mitad del arco, de a dónde a dónde: las etapas van en carriles, como un hipnograma doblado.
  const ARCO = { ancho: 325, alto: 170, cx: 162.5, cy: 164 };
  const CARRILES = { despierto: { r: 141, w: 6 }, rem: { r: 132, w: 8 }, nucleo: { r: 122, w: 8 }, profundo: { r: 112, w: 8 } };
  const SOL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 17a4.5 4.5 0 0 1 9 0"/><path d="M12 7.5v2.2M5.3 10.3l1.5 1.5M18.7 10.3l-1.5 1.5M3 17h2M19 17h2M3.5 20.5h17"/></svg>';
  const LISTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12.5 4 4 8-9"/></svg>';

  const CSS = `
.sueno {
  --sn-2: rgba(214, 226, 250, 0.82); --sn-3: rgba(196, 212, 246, 0.68); --sn-linea: rgba(150, 178, 240, 0.15);
  --sn-rem: #a8e2f0; --sn-nucleo: #6aa2f0; --sn-profundo: #6a5fd6; --sn-despierto: #efb08c; --sn-azul: #6b8ff0; --sn-verde: #2ea8a0; --sn-verde-claro: #8adbc8;
}
/* El azul de la noche no se desliza con la página: se aclara y se apaga con el gesto, como el velo del cielo. */
.velo-pestanas .velo-sueno {
  position: absolute; inset: 0; opacity: 0;
  background:
    radial-gradient(120% 42% at 84% -4%, rgba(96, 132, 226, 0.3), rgba(96, 132, 226, 0) 72%),
    radial-gradient(90% 30% at -6% 64%, rgba(50, 171, 146, 0.08), rgba(50, 171, 146, 0) 74%),
    linear-gradient(180deg, rgba(17, 34, 82, 0.95) 0%, rgba(11, 22, 58, 0.96) 50%, rgba(7, 14, 38, 0.97) 100%);
}
.sueno.pagina-app::after { background: linear-gradient(180deg, rgba(6, 12, 32, 0), rgba(6, 12, 32, 0.9) 75%); }
.sn-scroll { transition: opacity 0.18s ease; }
.sn-scroll.sn-fundiendo { opacity: 0; }
.sueno .pg-fecha { color: var(--sn-3); }
.sueno .pg-carta { background: rgba(40, 62, 132, 0.46); border-color: rgba(150, 178, 240, 0.17); }
.sueno .pg-carta-titulo { color: var(--sn-2); }
.sueno .pg-cifra span, .sueno .pg-nota, .sueno .pg-texto { color: var(--sn-2); }
.sueno .pg-aviso { background: rgba(150, 178, 240, 0.08); border-color: var(--sn-linea); color: var(--sn-2); }
.sueno .pg-como { overflow: hidden; color: var(--sn-2); transition: height 0.3s ease, opacity 0.25s ease; }
.sueno .pg-como:not([hidden]) { animation: sn-aparece 0.3s ease both; }
.sueno .pg-como.cerrando { height: 0 !important; opacity: 0; margin: 0; animation: none; }
.sueno .sn-nota, .sueno .sn-pie, .sueno .sn-poco-nota { color: var(--sn-3); }
.sueno .sn-carta .pg-cifra b { font-size: 32px; }
.sueno .sn-carta.sn-entra, .sueno .sn-noches.sn-entra { animation: sn-aparece 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sueno .sn-carta.sn-entra.cerrando { animation: none; }
.sueno .sn-manana.sn-quieta, .sueno .sn-manana-hecha.sn-quieta, .sueno .sn-hora.sn-quieta, .sueno .sn-porque-dentro.sn-quieta { animation: none; }
.sueno .sn-porque-dentro { overflow: hidden; transition: height 0.28s ease, opacity 0.22s ease; }
.sueno .sn-porque-dentro.cerrando { height: 0 !important; padding: 0; opacity: 0; animation: none; }

/* La tira de las dos semanas. */
.sueno .sn-noches { background: rgba(40, 62, 132, 0.36); border-color: rgba(150, 178, 240, 0.15); margin-top: 12px; }
.sueno .sn-manana + .sn-noches, .sueno .sn-manana-hecha + .sn-noches { margin-top: 12px; }
.sueno .sn-noche { color: var(--sn-3); }
.sueno .sn-noche.elegida { background: rgba(150, 178, 240, 0.18); color: var(--tinta); }
.sueno .sn-noche-barra { background: rgba(150, 178, 240, 0.1); width: 10px; }
.sueno .sn-noche-barra > i { background: linear-gradient(180deg, #a8e2f0, #6b8ff0 52%, #5a5fd0); transform-origin: bottom; }
.sueno .sn-noche.llego .sn-noche-barra > i { background: linear-gradient(180deg, #8adbc8, #4fa6c8 46%, #5a78d8); }
.sueno .sn-noche.vacia .sn-noche-barra > i { background: repeating-linear-gradient(135deg, rgba(196, 212, 246, 0.2) 0 2px, transparent 2px 5px); }
.sueno .sn-noche.antes { cursor: default; }
.sueno .sn-noche.antes .sn-noche-barra > i { background: none; }
.sueno .sn-noche.cama .sn-noche-barra > i { background: none; border-color: rgba(196, 212, 246, 0.45); }
.sueno .sn-noche-meta { background: rgba(239, 230, 207, 0.5); }
.sueno .sn-noche.moss.estimada .sn-noche-barra > i { opacity: 0.72; }
.sueno .sn-noches.sn-animar .sn-noche-barra > i { animation: sn-barra 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(var(--i) * 22ms); }
.sn-noches-nota { grid-column: 1 / -1; margin: 6px 4px 0; font: 400 12px/1.3 var(--texto); color: var(--sn-2); text-align: center; }
@keyframes sn-barra { from { transform: scaleY(0); } }

/* El arco de la noche: el sueño de la noche, del anochecer a la mañana. */
.sueno .pg-carta.sn-heroe { background: linear-gradient(178deg, #0d1a46 0%, #13245e 58%, #1d3376 100%); }
.sn-arco { position: relative; margin-top: 2px; }
.sn-arco svg { display: block; width: 100%; height: auto; overflow: visible; }
.sn-arco .pista { fill: none; stroke: rgba(150, 178, 240, 0.09); stroke-linecap: butt; }
.sn-arco .tramo { fill: none; stroke-linecap: round; }
.sn-arco .grueso { fill: none; stroke-linecap: butt; }
.sn-arco .grueso.redondo { stroke-linecap: round; }
.sn-arco .e-despierto { stroke: var(--sn-despierto); }
.sn-arco .e-rem { stroke: var(--sn-rem); }
.sn-arco .e-nucleo, .sn-arco .e-dormido { stroke: var(--sn-nucleo); }
.sn-arco .e-profundo { stroke: var(--sn-profundo); }
.sn-arco .hito { stroke: rgba(196, 212, 246, 0.42); stroke-width: 1; stroke-linecap: butt; }
.sn-arco .tramo { cursor: pointer; transition: opacity 0.2s ease; }
.sn-arco g.leyendo .tramo { opacity: 0.32; }
.sn-arco g.leyendo .tramo.leida { opacity: 1; }
.sn-arco-centro.cambia { animation: hj-aparece 0.22s ease both; }
.sn-arco text { fill: rgba(196, 212, 246, 0.72); stroke: none; font: 400 9.5px var(--numeros); text-anchor: middle; font-variant-numeric: tabular-nums; }
.sn-arco .horizonte { stroke: rgba(150, 178, 240, 0.3); stroke-width: 1; }
.sn-arco .estrella { fill: #dfe8ff; stroke: none; }
.sn-arco .fantasma { fill: none; stroke: rgba(196, 212, 246, 0.5); stroke-width: 2; stroke-dasharray: 1 7; stroke-linecap: round; }
.sn-arco .revela { fill: none; stroke: #fff; stroke-dasharray: 1; stroke-dashoffset: 0; }
.sn-arco .revela.animar { animation: sn-revela 1.2s cubic-bezier(0.3, 0.7, 0.2, 1) both; }
@keyframes sn-revela { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
.sn-arco-centro { position: absolute; left: 0; right: 0; bottom: 12px; display: grid; justify-items: center; gap: 4px; pointer-events: none; }
.sn-arco-centro b { font: 400 33px/1 var(--numeros); letter-spacing: -0.015em; color: #fbf2d9; font-variant-numeric: tabular-nums; }
.sn-arco-centro.chico b { font-size: 24px; color: var(--tinta); }
.sn-arco-centro span { font: 400 13px/1.1 var(--texto); color: var(--sn-2); }
.sn-arco-horas { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; }
.sn-arco-hora { display: grid; grid-template-columns: 20px auto; column-gap: 7px; align-items: center; }
.sn-arco-hora.fin { grid-template-columns: auto 20px; text-align: right; }
.sn-arco-hora svg { grid-row: 1 / span 2; width: 19px; height: 19px; color: #c6d6fa; }
.sn-arco-hora.fin svg { grid-column: 2; color: #f3dfb0; }
.sn-arco-hora b { font: 400 17px/1.1 var(--numeros); font-variant-numeric: tabular-nums; }
.sn-arco-hora small { font: 400 11.5px/1.25 var(--texto); color: var(--sn-3); }

/* Las etapas: cuánto de cada una, en una barra y con su nombre. */
.sn-proporcion { display: flex; gap: 2px; height: 8px; margin-top: 12px; }
.sn-proporcion i { display: block; min-width: 3px; }
.sn-proporcion i:first-child { border-radius: 4px 0 0 4px; }
.sn-proporcion i:last-child { border-radius: 0 4px 4px 0; }
.sueno .sn-etapas { margin-top: 8px; }
.sueno .sn-etapa { padding: 2px 0 0; background: none; border-radius: 0; }
.sueno .sn-etapa span { color: var(--sn-2); font-size: 11.5px; }
.sueno .sn-etapa small { color: var(--sn-3); }
.sueno .sn-rem i, .sueno .sn-proporcion .sn-rem { background: var(--sn-rem); }
.sueno .sn-nucleo i, .sueno .sn-proporcion .sn-nucleo { background: var(--sn-nucleo); }
.sueno .sn-profundo i, .sueno .sn-proporcion .sn-profundo { background: var(--sn-profundo); }
.sueno .sn-dato { border-top-color: var(--sn-linea); }
.sn-clave-despierto { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; background: var(--sn-despierto); }
.sueno .sn-confianza.alta, .sueno .sn-origen.confirmada, .sueno .sn-origen.corregida, .sueno .sn-origen.manual { color: #b9d6fb; background: rgba(120, 170, 240, 0.16); }
.sueno .sn-confianza.baja, .sueno .sn-origen { color: var(--sn-2); background: rgba(150, 178, 240, 0.12); }
.sn-ejemplo { flex: none; font: 500 10px/1 var(--texto); font-style: normal; letter-spacing: 0.08em; padding: 5px 8px; border-radius: 999px; color: var(--tinta); background: rgba(239, 230, 207, 0.1); border: 1px dashed rgba(239, 230, 207, 0.32); }
.sn-muestra { opacity: 0.84; }

/* Sin noches: la invitación. */
.sn-invita-titulo { margin: 12px 0 0; font: 500 21px/1.2 var(--numeros); color: var(--tinta); }
.sn-invita-texto { margin: 2px 0 6px; font: 400 13.5px/1.4 var(--texto); color: var(--sn-2); }
.sn-caminos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.sn-camino { display: flex; flex-direction: column; gap: 6px; padding: 12px 12px 10px; border-radius: 14px; background: rgba(150, 178, 240, 0.09); border: 1px solid var(--sn-linea); min-width: 0; }
.sn-camino svg { width: 22px; height: 22px; color: #c6d6fa; }
.sn-camino b { font: 500 14px/1.2 var(--texto); color: var(--tinta); }
.sn-camino p { flex: 1; margin: 0; font: 400 12.5px/1.38 var(--texto); color: var(--sn-2); }
.sn-camino .sn-permitir, .sn-camino .sn-otra { width: 100%; min-height: 38px; margin-top: 4px; padding: 0 6px; font-size: 13px; border-radius: 12px; }
.sn-camino .sn-otra { border-color: rgba(214, 226, 250, 0.32); transition: height 0.26s ease, min-height 0.26s ease, margin 0.26s ease, opacity 0.2s ease; }
.sn-camino .sn-otra.cerrando { height: 0 !important; min-height: 0; margin: 0; opacity: 0; border-color: transparent; overflow: hidden; }
.sn-camino-listo { display: flex; align-items: center; gap: 6px; font: 400 12.5px/1.3 var(--texto); color: var(--sn-verde-claro); animation: sn-aparece 0.35s ease both; }
.sn-camino-listo svg { flex: none; width: 15px; height: 15px; color: inherit; }
.sn-simular { appearance: none; cursor: pointer; padding: 2px 0; border: 0; background: none; font: 400 11.5px/1.25 var(--texto); color: var(--sn-3); text-align: left; text-decoration: underline; overflow: hidden; animation: sn-simular 0.4s ease both; }
@keyframes sn-simular { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 44px; } }

/* Cuánto falta para cada cosa: los puntos y una línea que dice qué hace que aparezca. */
.sn-progreso { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; column-gap: 9px; row-gap: 5px; margin-top: 10px; padding: 10px 12px 11px; border-radius: 12px; background: rgba(150, 178, 240, 0.09); }
.sn-progreso-puntos { display: inline-flex; gap: 4px; flex-wrap: wrap; }
.sn-progreso-puntos i { width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(196, 212, 246, 0.5); }
.sn-progreso-puntos i.lleno { background: #a8c8fa; box-shadow: none; }
.sn-progreso b { font: 500 12.5px/1.2 var(--numeros); color: var(--tinta); font-variant-numeric: tabular-nums; }
.sn-progreso p { grid-column: 1 / -1; margin: 0; font: 400 12.5px/1.4 var(--texto); color: var(--sn-2); }
.sn-enlace { appearance: none; cursor: pointer; justify-self: start; display: inline-flex; align-items: center; gap: 3px; padding: 8px 0 2px; border: 0; background: none; color: var(--oro-claro); font: 400 13px/1 var(--texto); }
.sn-enlace svg { width: 15px; height: 15px; }

/* La deuda: el medidor, y lo que sumó o pagó cada noche contra lo que necesitas. */
.sn-sin-deuda { display: inline-flex; align-items: center; gap: 8px; }
.sn-sin-deuda i { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: #0b2a26; background: var(--sn-verde-claro); }
.sn-sin-deuda svg { width: 15px; height: 15px; stroke-width: 2.4; }
.sn-medidor { display: grid; gap: 5px; margin-top: 8px; }
.sn-medidor-pista { position: relative; height: 10px; border-radius: 5px; background: rgba(107, 143, 240, 0.22); overflow: hidden; }
.sn-medidor-pista > i:first-child { display: block; height: 100%; width: 100%; border-radius: 5px; transform-origin: left; transform: scaleX(var(--f, 0)); background: linear-gradient(90deg, #6b8ff0, #a8c8fa); transition: transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1); }
.sn-medidor-pista > em { position: absolute; top: 0; bottom: 0; width: 2px; background: #1a2b66; }
.sn-medidor-cero { position: absolute; left: 0; top: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--sn-verde-claro); animation: hj-aparece 0.5s ease both; }
.sn-medidor-ejes { display: flex; justify-content: space-between; font: 400 11px/1 var(--texto); color: var(--sn-3); font-variant-numeric: tabular-nums; }
.sn-leyenda { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 12px; font: 400 11.5px/1.2 var(--texto); color: var(--sn-2); }
.sn-leyenda span { display: inline-flex; align-items: center; gap: 5px; }
.sn-leyenda i { width: 10px; height: 10px; border-radius: 3px; }
.sn-leyenda i.banda { background: rgba(168, 200, 250, 0.3); }
.sn-leyenda-banda { margin-top: 8px; }
.sn-leyenda i.sobra { background: var(--sn-verde); }
.sn-leyenda i.falta { background: var(--sn-azul); }
.sn-leyenda i.linea { width: 14px; height: 0; border-radius: 0; border-top: 1px solid rgba(239, 230, 207, 0.72); }
.sn-dd { position: relative; display: grid; grid-template-columns: repeat(14, minmax(0, 1fr)); margin-top: 8px; }
.sn-dd-col { appearance: none; cursor: pointer; display: grid; justify-items: center; gap: 5px; padding: 0; border: 0; background: none; color: var(--sn-3); font: 400 9.5px/1 var(--texto); transition: color 0.2s ease; }
.sn-dd-zona { position: relative; display: block; width: 100%; height: 88px; }
.sn-dd-col i { position: absolute; left: 50%; width: 13px; margin-left: -6.5px; opacity: var(--o, 1); transition: opacity 0.2s ease; }
.sn-dd-col i.sobra { background: var(--sn-verde); border-radius: 4px 4px 0 0; transform-origin: bottom; }
.sn-dd-col i.falta { background: var(--sn-azul); border-radius: 0 0 4px 4px; transform-origin: top; }
.sn-dd-col i.nada { width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: none; box-shadow: inset 0 0 0 1px rgba(196, 212, 246, 0.6); }
.sn-dd.sn-animar .sn-dd-col i.sobra, .sn-dd.sn-animar .sn-dd-col i.falta { animation: sn-barra 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(var(--i) * 26ms); }
.sn-dd-col.elegida { color: var(--tinta); }
.sn-dd-col.elegida i { --o: 1; filter: brightness(1.1); }
.sn-dd-meta { position: absolute; left: 0; right: 0; height: 1px; background: rgba(239, 230, 207, 0.62); pointer-events: none; }
.sn-lectura { min-height: 18px; margin-top: 8px; font: 400 12.5px/1.4 var(--texto); color: var(--tinta); font-variant-numeric: tabular-nums; }
.sn-lectura.cambia { animation: sn-aparece 0.22s ease both; }

/* La calidad: el anillo, partido en lo que suma cada parte. */
.sn-calidad-fila { display: flex; align-items: center; gap: 14px; margin-top: 4px; }
.sn-anillo { position: relative; flex: none; width: 108px; height: 108px; }
.sn-anillo svg { display: block; width: 100%; height: 100%; transform: rotate(-90deg); }
.sn-anillo circle { fill: none; stroke-width: 9; }
.sn-anillo .pista { stroke: rgba(150, 178, 240, 0.16); }
.sn-anillo .lleno { transition: stroke-dasharray 1s cubic-bezier(0.2, 0.7, 0.2, 1); }
.sn-anillo .p-duracion { stroke: #b3d0fb; }
.sn-anillo .p-horario { stroke: #7fa6f6; }
.sn-anillo .p-continuidad { stroke: #5b7fe6; }
.sn-anillo.fantasma .pista { stroke-dasharray: 2 6; stroke-linecap: round; stroke-width: 2; stroke: rgba(196, 212, 246, 0.5); }
.sn-anillo-centro { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; }
.sn-anillo-centro b { font: 400 31px/1 var(--numeros); color: #fbf2d9; font-variant-numeric: tabular-nums; }
.sn-calidad-lado { flex: 1; min-width: 0; display: grid; gap: 8px; }
.sueno .sn-partes { margin-top: 0; gap: 7px; }
.sueno .sn-parte { font-size: 12.5px; row-gap: 4px; }
.sueno .sn-parte b { font-size: 12px; color: var(--sn-2); }
.sueno .sn-parte-barra { background: rgba(150, 178, 240, 0.16); height: 3px; }
.sueno .sn-parte-duracion .sn-parte-barra i { background: #b3d0fb; }
.sueno .sn-parte-horario .sn-parte-barra i { background: #7fa6f6; }
.sueno .sn-parte-continuidad .sn-parte-barra i { background: #5b7fe6; }
.sueno .sn-parte .sn-progreso-puntos { grid-column: 1 / -1; }

/* El horario: cada noche de cuándo a cuándo, con las guías de las horas y la banda de lo de siempre. */
.sueno .sn-rangos { position: relative; gap: 3px; margin-top: 8px; }
.sn-guias { position: absolute; left: 22px; right: 0; top: 0; bottom: 0; pointer-events: none; }
.sn-guias i { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(150, 178, 240, 0.13); }
.sn-guias em { position: absolute; top: 0; bottom: 0; background: rgba(168, 200, 250, 0.13); border-radius: 3px; }
.sueno .sn-rango { position: relative; appearance: none; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; color: var(--sn-3); text-align: left; }
.sueno .sn-rango-pista { height: 10px; border-radius: 5px; background: rgba(150, 178, 240, 0.05); }
.sueno .sn-rango-pista i { border-radius: 5px; background: linear-gradient(90deg, #5a5fd0, #6b8ff0 45%, #a8e2f0); opacity: 0.86; transform-origin: left; }
.sueno .sn-rangos.sn-animar .sn-rango-pista i { animation: sn-rango 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(var(--i) * 24ms); }
@keyframes sn-rango { from { opacity: 0; transform: scaleX(0.5); } }
.sueno .sn-rango.elegida { color: var(--tinta); }
.sueno .sn-rango.elegida .sn-rango-pista i { opacity: 1; background: linear-gradient(90deg, #7a80ee, #8fb0ff 45%, #c6f0f8); box-shadow: none; }
.sueno .sn-rango.tocada { color: var(--tinta); }
.sueno .sn-rango.tocada .sn-rango-pista i { opacity: 1; filter: brightness(1.2); }
.sueno .sn-rango.vacia .sn-rango-pista { background: radial-gradient(circle, rgba(196, 212, 246, 0.42) 0.8px, transparent 1.1px) left center / 7px 10px repeat-x; }
.sueno .sn-rango.vacia.antes .sn-rango-pista { background: rgba(150, 178, 240, 0.05); }
.sn-eje-horas { position: relative; height: 13px; margin: 5px 0 0 22px; font: 400 10px/13px var(--numeros); color: var(--sn-3); font-variant-numeric: tabular-nums; }
.sn-eje-horas span { position: absolute; top: 0; transform: translateX(-50%); }
.sn-eje-horas span.pegada-izq { transform: none; }
.sn-eje-horas span.pegada-der { transform: translateX(-100%); }
.sn-dos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
.sn-dos > div { display: grid; gap: 4px; padding: 10px 12px; border-radius: 12px; background: rgba(150, 178, 240, 0.09); }
.sn-dos span { font: 400 11.5px/1.2 var(--texto); color: var(--sn-2); }
.sn-dos b { font: 400 17px/1.1 var(--numeros); font-variant-numeric: tabular-nums; }
.sn-dos small { font: 400 11.5px/1.1 var(--numeros); color: var(--sn-3); font-variant-numeric: tabular-nums; }
.sueno .in-estado.buena { color: var(--sn-verde-claro); background: rgba(46, 168, 160, 0.18); }
.sueno .in-estado.enCamino { color: #b9d6fb; background: rgba(120, 170, 240, 0.16); }
.sueno .in-estado.floja { color: var(--sn-2); background: rgba(150, 178, 240, 0.14); }

/* Lo que mide el reloj: el valor, si es lo de siempre y su línea de las dos semanas. */
.sueno .sn-vital { grid-template-columns: 30px minmax(0, 1fr) 62px 78px; column-gap: 8px; row-gap: 0; align-items: center; padding: 9px 0; border-top-color: var(--sn-linea); }
.sn-vital-icono { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; background: rgba(120, 160, 240, 0.18); color: #bcd2fa; }
.sn-vital-icono svg { width: 17px; height: 17px; }
.sn-vital-textos { display: grid; gap: 3px; min-width: 0; }
.sn-vital-textos > span { font: 400 13px/1.15 var(--texto); }
.sueno .sn-comparado { grid-column: auto; justify-self: start; font-size: 11.5px; color: var(--sn-3); }
.sueno .sn-comparado.usual { color: #b9d6fb; }
.sueno .sn-vital b { font: 400 14.5px/1 var(--numeros); text-align: right; white-space: nowrap; }
.sn-chispa { display: block; width: 100%; height: 26px; }
.sn-chispa .base { stroke: rgba(196, 212, 246, 0.3); stroke-width: 1; }
.sn-chispa .trazo { fill: none; stroke: #9cc0f8; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.sn-chispa .punto { fill: #9cc0f8; stroke: none; }
.sn-chispa .fin { fill: #fbf2d9; stroke: none; }

/* De dónde sale cada dato. */
.sueno .sn-puntos i { background: rgba(150, 178, 240, 0.2); }
.sueno .sn-puntos i.lleno { background: #a8c8fa; box-shadow: none; }
.sueno .sn-precision b { color: var(--sn-2); }
.sueno .sn-fuentes-lista li { border-top-color: var(--sn-linea); }
.sueno .sn-fuente { color: var(--sn-2); }
.sueno .sn-niveles li { grid-template-columns: minmax(0, 1fr) auto; }
.sueno .sn-niveles .sn-fuente { white-space: normal; font-size: 13px; }

/* La pregunta de la mañana y Afinar, en azul. */
.sueno .sn-cara { color: var(--sn-2); }
.sueno .sn-cara:hover, .sueno .sn-cara:focus-visible { background: rgba(150, 178, 240, 0.1); }
.sueno .sn-ahora-no { color: var(--sn-3); }
.sueno .sn-hora-nota, .sueno .sn-movimiento p { color: var(--sn-2); }
.sueno .sn-hora + .sn-caras-bloque, .sueno .sn-porque-abrir, .sueno .sn-editor-noche { border-top-color: var(--sn-linea); }
.sueno .sn-porque-abrir { color: var(--sn-2); }
.sueno .sn-afinar-fila { border-top-color: var(--sn-linea); }
.sueno .sn-afinar-textos span { color: var(--sn-2); }
.sueno .sn-afinar-textos span.llego { color: var(--sn-verde-claro); }
.sueno .sn-paso { border-color: rgba(150, 178, 240, 0.24); background: rgba(150, 178, 240, 0.1); }
.sueno .sn-otra { border-color: rgba(214, 226, 250, 0.3); }
.sueno .sn-franja { background: rgba(150, 178, 240, 0.08); }
.tel .hb.sn-hoja { padding-bottom: 0; }
.tel .sn-hoja .sn-hoja-cuerpo { padding: 2px 16px calc(var(--abajo) + 18px); }
/* Las hojas de Afinar, con cada cosa en su tarjeta, como las de Perfil. */
.tel .sn-hoja .pf-aviso { margin-top: 10px; padding: 13px 14px; border: 1px solid rgba(150, 178, 240, 0.14); border-radius: 18px; background: rgba(120, 150, 230, 0.07); }
.tel .sn-hoja .pf-aviso-fila b { font: 400 15px/1.2 var(--texto); }
.tel .sn-hoja .pf-grupo { margin: 18px 4px 8px; }
.tel .sn-hoja .pf-nota { margin: 10px 4px 0; }
.tel .sn-hoja .sn-abrir-atajos { margin: 12px 4px 2px; }
.tel .sn-hoja .sn-automatizacion-cab .sn-afinar-textos { padding: 0; }
.tel .sn-hoja .sn-pasos { margin: 12px 0 2px; }
@media (prefers-reduced-motion: reduce) {
  .sn-scroll, .sn-medidor-pista > i, .sn-anillo .lleno, .sn-dd-col, .sn-dd-col i, .sueno .pg-como, .sn-camino .sn-otra, .sn-arco .tramo, .sueno .sn-porque-dentro { transition: none; }
  .sn-arco-centro.cambia { animation: none; }
  .sueno .sn-carta.sn-entra, .sueno .sn-noches.sn-entra, .sueno .sn-noches.sn-animar .sn-noche-barra > i, .sn-dd.sn-animar .sn-dd-col i.sobra, .sn-dd.sn-animar .sn-dd-col i.falta,
  .sueno .sn-rangos.sn-animar .sn-rango-pista i, .sn-arco .revela.animar, .sn-lectura.cambia, .sn-camino-listo, .sn-simular, .sueno .pg-como:not([hidden]), .sn-medidor-cero { animation: none; }
}
`;

  function crear(tel, opciones) {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // `estado`, para mirar la propuesta: con datos, con una o dos noches, sin noches, sin deuda o con mucha.
    const s = { clave: Datos.HOY, abierto: null, cambiando: false, editandoHora: false, editando: null, forzarHora: null, estado: 'datos', lectura: {}, dibujada: null, conIphone: false };
    // Lo que contestó cada mañana, de 1 a 5, por noche: queda en este navegador, como quedaría en el
    // teléfono. «Ahora no» la esconde solo por hoy.
    const GUARDADO_CARAS = 'moss-galeria-caras';
    let caras = {};
    try { caras = JSON.parse(localStorage.getItem(GUARDADO_CARAS) || '{}') || {}; } catch (_) { caras = {}; }
    const ahoraNo = new Set();
    function ponerCara(clave, cara) {
      caras[clave] = cara;
      try { localStorage.setItem(GUARDADO_CARAS, JSON.stringify(caras)); } catch (_) { /* no pasa nada */ }
      // Nada desaparece de golpe: la cara elegida brilla, la tarjeta se cierra y entra la línea.
      cerrarPregunta(() => {
        s.cambiando = false;
        pintar();
        if (opciones.alCambiarCara) opciones.alCambiarCara();
      }, cara);
    }
    /** Cierra una parte (alto, opacidad y márgenes) y después rearma Sueño: nada desaparece de golpe. */
    function colapsar(nodo, despues, demora) {
      if (!nodo || quieto()) { despues(); return; }
      nodo.style.height = `${nodo.offsetHeight}px`;
      // Leer el alto otra vez fija el de partida: así la transición corre aunque no haya cuadros.
      void nodo.offsetHeight;
      nodo.classList.add('cerrando');
      setTimeout(despues, demora || 480);
    }
    /** La tarjeta de la mañana se cierra y después se rearma Sueño; con la hora todavía por contestar, solo las caras. */
    function cerrarPregunta(despues, cara) {
      const carta = cont.querySelector('.sn-manana');
      if (carta && cara) carta.querySelectorAll('.sn-cara').forEach((b, i) => b.classList.toggle('elegida', i + 1 === cara));
      const soloCaras = carta && carta.querySelector('.sn-hora') ? carta.querySelector('.sn-caras-bloque') : null;
      colapsar(soloCaras || carta, despues, cara ? 760 : 480);
    }
    const edad = Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento;
    const necesidadDeFabrica = Sueno.necesidad(edad);
    // Para ver la deuda en sus extremos: la misma persona, si dijera que le alcanza con 7 horas o que necesita 9.
    const necesidad = () => Sueno.necesidad(edad, s.estado === 'pagada' ? 7 * 60 : s.estado === 'mucha' ? 9 * 60 : null);

    const zona = el('section', 'sueno pagina-app');
    zona.innerHTML = '<div class="sn-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.sn-scroll');

    // ------------------------------------------------------------ sin reloj (spec/sueno.md, «Sin reloj»)
    // Lo que contestó cada mañana sobre la hora (confirmada, corregida o escrita) queda en este
    // navegador, como quedaría en el teléfono, y pisa lo que había estimado Moss.
    const GUARDADO_HORAS = 'moss-galeria-horas';
    let horas = {};
    try { horas = JSON.parse(localStorage.getItem(GUARDADO_HORAS) || '{}') || {}; } catch (_) { horas = {}; }
    const GUARDADO_MOVIMIENTO = 'moss-galeria-movimiento';
    let conMovimiento = false;
    try { conMovimiento = localStorage.getItem(GUARDADO_MOVIMIENTO) === 'si'; } catch (_) { conMovimiento = false; }
    const sinReloj = () => !!(opciones.sinReloj && opciones.sinReloj());
    const propias = () => (sinReloj() ? Datos.PROPIAS_SIN_RELOJ.map((p) => (horas[p.fecha] ? Object.assign({}, p, { hora: horas[p.fecha] }) : p)) : []);
    // Las de Salud y, donde Salud no tiene nada, las de Moss: como en la app (src/secciones/persona.ts).
    const todasLasNoches = () => SinReloj.conNochesDeMoss(opciones.noches(), propias(), Datos.ZONA);
    // Las que ve esta sección: elegir «una noche» o «sin noches» no cambia Inicio ni Ascent.
    const noches = () => {
      if (s.estado === 'vacio') return [];
      const lista = todasLasNoches();
      if (s.estado !== 'una' && s.estado !== 'dos') return lista;
      return lista.filter((n) => n.clave > Fechas.sumarDias(Datos.HOY, s.estado === 'una' ? -1 : -2));
    };
    const hayNoches = () => noches().length > 0;
    const pocasNoches = () => s.estado === 'una' || s.estado === 'dos';
    // El «en cama» del iPhone: con pocas noches o sin noches, todavía nada.
    const soloEnCama = (clave) => (s.estado === 'datos' || s.estado === 'pagada' || s.estado === 'mucha' ? Datos.SOLO_EN_CAMA.get(clave) : undefined);
    // Las dos semanas de la persona de mentira, para el ejemplo de cada tarjeta.
    const muestra = () => Sueno.ultimasNoches(Datos.NOCHES, Datos.HOY, DIAS);
    /** Lo que contestaste de la hora de una noche, en minutos desde las 18. */
    function ponerHora(clave, dormirse, despertar, origen) {
      const antes = propias().find((p) => p.fecha === clave);
      const h = antes && antes.hora;
      const iso = (min) => new Date(SinReloj.instanteDe(clave, Datos.ZONA, min)).toISOString();
      horas[clave] = Object.assign({ dormirse: iso(dormirse), despertar: iso(despertar), origen, confianza: h ? h.confianza : 'media' }, h && h.estimada ? { estimada: h.estimada } : {});
      try { localStorage.setItem(GUARDADO_HORAS, JSON.stringify(horas)); } catch (_) { /* no pasa nada */ }
    }
    /** Qué preguntar de la hora a la mañana: solo sin reloj, si Moss no está segura, y una mañana por semana sin proponer. */
    function queHora(clave) {
      if (!sinReloj() || !hayNoches()) return null;
      const p = propias().find((x) => x.fecha === clave);
      if (!p || !p.hora || p.hora.origen !== 'estimada') return null;
      // Con pocas noches son los primeros días: se pregunta siempre, como en la app (`desde`).
      return s.forzarHora || SinReloj.quePreguntar(clave, p.hora.confianza, pocasNoches() ? noches()[0].clave : null);
    }
    /**
     * Las dos horas, de a 5 minutos, con «Guardar». `alGuardar(dormirse, despertar, cambiadas)`, en
     * minutos desde las 18: guardar sin mover nada es confirmar lo que había, con sus horas exactas.
     */
    function editorDeHora(desde, hasta, alGuardar, soloDormirse) {
      const caja = el('div', 'sn-editor');
      let a = Math.round(desde / 5) * 5, b = Math.round(hasta / 5) * 5;
      let cambiadas = false;
      const fila = (texto, leer, mover) => {
        const f = el('div', 'sn-editor-fila');
        const valor = el('b', null, reloj(leer()));
        const paso = (d) => { cambiadas = true; mover(d); valor.textContent = reloj(leer()); };
        f.append(el('span', null, texto), boton('sn-paso', '−', () => paso(-5), tx('sueno.manana.antes')), valor, boton('sn-paso', '+', () => paso(5), tx('sueno.manana.despues')));
        return f;
      };
      caja.append(fila(tx('sueno.manana.teDormiste'), () => a, (d) => { a = Math.min(b - 60, a + d); }));
      // Con la hora de despertar sacada de un ancla (la alarma parada), solo la de dormirte.
      if (!soloDormirse) caja.append(fila(tx('sueno.manana.teDespertaste'), () => b, (d) => { b = Math.max(a + 60, b + d); }));
      caja.append(boton('sn-guardar', tx('sueno.manana.guardar'), () => (cambiadas ? alGuardar(a, soloDormirse ? hasta : b, true) : alGuardar(desde, hasta, false))));
      return caja;
    }
    /** La pregunta de la hora: «¿Dormiste de 00:30 a 08:10?» con «Sí» y «Cambiar», o las horas sin proponer nada. */
    function bloqueDeHora(clave, modo) {
      const n = noches().find((x) => x.clave === clave);
      // Lo mismo de antes queda quieto; pasar a cambiar la hora entra con su fundido.
      const firmaDeHora = `${modo}|${s.editandoHora}`;
      const b = el('div', 'sn-hora' + (firmaDeHora === s.horaVista ? ' sn-quieta' : ''));
      s.horaVista = firmaDeHora;
      // Cerrar la pregunta: si las caras ya están contestadas, se va la tarjeta entera.
      const listo = () => {
        s.editandoHora = false;
        const carta = cont.querySelector('.sn-manana');
        colapsar(carta && carta.querySelector('.sn-caras-bloque') ? b : carta, pintar, 480);
      };
      if (modo === 'proponer' && !s.editandoHora) {
        // Con la alarma parada, la hora de despertar ya se sabe: se pregunta solo la de dormirte.
        if (s.soloDormirse) {
          b.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.horaDormirse', { hora: reloj(n.dormirse) })));
          b.appendChild(el('p', 'sn-hora-nota', tx('sueno.manana.horaDormirseNota', { hora: reloj(n.despertar), seguridad: tx('sueno.seguridad.' + n.moss.confianza) })));
        } else {
          b.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.hora', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) })));
          b.appendChild(el('p', 'sn-hora-nota', tx('sueno.manana.horaNota', { seguridad: tx('sueno.seguridad.' + n.moss.confianza) })));
        }
        const acciones = el('div', 'sn-hora-acciones');
        acciones.append(
          boton('sn-si', tx('sueno.manana.si'), () => { ponerHora(clave, n.dormirse, n.despertar, 'confirmada'); listo(); }),
          boton('sn-otra', tx('sueno.manana.otraHora'), () => { s.editandoHora = true; pintar(); }),
        );
        b.appendChild(acciones);
        b.appendChild(porque(clave));
        return b;
      }
      // Sin proponer, arranca en lo de siempre y no en lo estimado: así se mide cuánto se acepta lo propuesto.
      const h = modo === 'sinProponer' ? SinReloj.habitualDe(noches(), clave) : null;
      b.classList.add('editando');
      b.appendChild(el('p', 'sn-manana-pregunta', tx(s.soloDormirse ? 'sueno.manana.sinProponerDormirse' : 'sueno.manana.sinProponer')));
      b.appendChild(editorDeHora(h ? h.dormirse : n.dormirse, h && !s.soloDormirse ? h.despertar : n.despertar, (x, y, cambiadas) => {
        // Sin proponer, lo escrito siempre es tuyo; si no, sin mover nada es un «Sí».
        ponerHora(clave, x, y, modo === 'sinProponer' ? 'manual' : cambiadas ? 'corregida' : 'confirmada');
        listo();
      }, s.soloDormirse));
      return b;
    }
    /** Cómo llegó a esa hora (lo pediste el 31/10/2026): cada señal, su hora y cuánto pesó (`pistas` de SinReloj.estimarNoche). */
    function porque(clave) {
      const e = Datos.ESTIMACIONES[clave];
      const caja = el('div', 'sn-porque');
      if (!e) return caja;
      const abrir = boton('sn-porque-abrir', `<span>${tx('sueno.manana.porque.abrir')}</span>${icono(s.porque ? 'arriba' : 'abajo')}`, () => {
        const cambiar = () => { s.porque = !s.porque; s.porqueVisto = false; pintar(); };
        const abierto = caja.querySelector('.sn-porque-dentro');
        if (abierto) colapsar(abierto, cambiar, 300); else cambiar();
      });
      abrir.setAttribute('aria-expanded', String(!!s.porque));
      caja.appendChild(abrir);
      if (!s.porque) return caja;
      const dentro = el('div', 'sn-porque-dentro' + (s.porqueVisto ? ' sn-quieta' : ''));
      s.porqueVisto = true;
      dentro.appendChild(lineaDeLaNoche(e));
      [['dormirse', e.dormirse], ['despertar', e.despertar]].forEach(([borde, hora]) => {
        const cab = el('h5');
        cab.append(el('span', null, tx('sueno.manana.porque.' + borde)), el('b', null, reloj(hora)));
        const ul = el('ul');
        e.pistas[borde].forEach((p) => {
          const li = el('li', p.noCuenta ? 'no-cuenta' : null);
          const fila = el('div');
          fila.append(el('span', null, nombreDePista(p)), el('b', null, reloj(p.en)));
          li.appendChild(fila);
          if (p.peso > 0 && e.pistas[borde].some((o) => o !== p && o.peso > 0)) {
            const barra = el('i');
            barra.style.setProperty('--peso', String(p.peso));
            li.appendChild(barra);
          } else if (p.noCuenta) li.appendChild(el('small', null, tx('sueno.manana.porque.noCuenta')));
          else if (!p.peso) li.appendChild(el('small', null, tx('sueno.manana.porque.confirma')));
          ul.appendChild(li);
        });
        dentro.append(cab, ul);
      });
      const yo = SinReloj.aprenderPersonal(propias(), clave);
      dentro.appendChild(el('p', 'sn-nota', tx(yo.noches > 0 ? 'sueno.manana.porque.tardas' : 'sueno.manana.porque.tardasFabrica', { n: yo.latencia })));
      dentro.appendChild(el('p', 'sn-nota', tx('sueno.manana.porque.nota')));
      caja.appendChild(dentro);
      return caja;
    }
    function nombreDePista(p) {
      if (p.que !== 'ultimaActividad' && p.que !== 'primeraActividad') return tx('sueno.manana.porque.pistas.' + p.que);
      const tipos = p.tipos || [];
      return tx(`sueno.manana.porque.pistas.${p.que}.${tipos.find((t) => t !== 'atajo') || tipos[0] || 'movimiento'}`);
    }
    /** La noche en una línea: lo dormido, con una marca por cada señal. */
    function lineaDeLaNoche(e) {
      const todas = [...e.pistas.dormirse, ...e.pistas.despertar];
      const desde = Math.min(e.dormirse, ...todas.map((p) => p.en)) - 15, hasta = Math.max(e.despertar, ...todas.map((p) => p.en)) + 15;
      const x = (m) => (8 + ((m - desde) / (hasta - desde)) * 304).toFixed(1);
      const marcas = todas.map((p) => `<circle class="${p.noCuenta ? 'no-cuenta' : ''}" cx="${x(p.en)}" cy="14" r="${p.noCuenta ? 2.6 : 3.2}"/>`).join('');
      const v = el('div', 'sn-porque-linea');
      v.innerHTML = `<svg viewBox="0 0 320 28" aria-hidden="true"><line class="base" x1="8" x2="312" y1="14" y2="14"/><line class="dormido" x1="${x(e.dormirse)}" x2="${x(e.despertar)}" y1="14" y2="14"/>${marcas}</svg>`;
      const pie = el('div', 'sn-porque-horas');
      pie.append(el('span', null, reloj(desde + 15)), el('span', null, reloj(hasta - 15)));
      v.appendChild(pie);
      return v;
    }
    /** Sin reloj y sin permiso, una vez: el movimiento del teléfono mejora la estimación. */
    function cartaDeMovimiento() {
      const c = carta('sn-movimiento', null);
      const txt = el('div');
      txt.append(el('b', null, tx('sueno.movimiento.titulo')), el('p', null, tx('sueno.movimiento.texto')));
      c.append(txt, boton('sn-permitir', tx('sueno.movimiento.permitir'), () => {
        conMovimiento = true;
        try { localStorage.setItem(GUARDADO_MOVIMIENTO, 'si'); } catch (_) { /* no pasa nada */ }
        colapsar(c, pintar, 480);
      }));
      return c;
    }
    const ultimas = (hasta) => Sueno.ultimasNoches(noches(), hasta, DIAS);
    // Las dos semanas antes de una noche: con eso se miden el horario de siempre y lo tuyo.
    const anterioresA = (clave) => Sueno.ultimasNoches(noches(), Fechas.sumarDias(clave, -1), DIAS);

    // Elegir otra noche o pasar a otro estado no cambia todo de golpe: lo de esa noche entra con un
    // fundido y los gráficos crecen. Repintar lo mismo (abrir «Por qué», cambiar la llave) los deja quietos.
    let animar = true;
    const carta = (clase, titulo, derecha) => {
      const c = el('article', 'pg-carta sn-carta ' + (clase || '') + (animar ? ' sn-entra' : ''));
      if (titulo) {
        const cab = el('header', 'pg-carta-cab');
        cab.appendChild(el('span', 'pg-carta-titulo', titulo));
        if (derecha) cab.appendChild(derecha);
        c.appendChild(cab);
      }
      return c;
    };
    const confianza = (nivel) => el('em', 'sn-confianza ' + nivel, tx('sueno.confianza.' + nivel));
    const chipDeEjemplo = () => el('em', 'sn-ejemplo', tx('sueno.vacio.ejemplo'));
    const desplegable = (clave, armar) => {
      const caja = el('div', 'pg-texto pg-como');
      caja.hidden = s.abierto !== clave;
      if (!caja.hidden) armar(caja);
      const b = boton('cm-enlace' + (s.abierto === clave ? ' abierto' : ''), `<span>${tx('progreso.comoSeCalcula')}</span>${icono('adelante')}`, () => {
        const abre = s.abierto !== clave;
        s.abierto = abre ? clave : null;
        b.classList.toggle('abierto', abre);
        if (abre) {
          caja.classList.remove('cerrando');
          caja.style.height = '';
          caja.innerHTML = '';
          armar(caja);
          caja.hidden = false;
          if (!quieto()) {
            const alto = caja.scrollHeight;
            caja.style.height = '0px';
            void caja.offsetHeight;
            caja.style.height = `${alto}px`;
            setTimeout(() => { if (s.abierto === clave) caja.style.height = ''; }, 320);
          }
          return;
        }
        // Se cierra achicándose, y recién después se esconde.
        colapsar(caja, () => { caja.hidden = true; caja.classList.remove('cerrando'); caja.style.height = ''; caja.innerHTML = ''; }, 300);
      });
      return [b, caja];
    };
    // Una hora del sueño: los minutos se cuentan desde las 18 del día anterior.
    const reloj = (min) => u.horaMin(min + 18 * 60);
    const diaCorto = (clave) => { const p = u.partes(clave); return `${tx('fecha.diasCortos.' + p.dia)} ${p.num}`; };
    /** Lo que se puede tocar en un gráfico se lee abajo: el día y lo de ese día. */
    function ponerLectura(nodo, texto) {
      if (nodo.textContent === texto) return;
      nodo.textContent = texto;
      nodo.classList.remove('cambia');
      void nodo.offsetWidth;
      nodo.classList.add('cambia');
    }
    /** Lo que se lee al tocar también se lee con el foco del teclado o con el mouse encima. */
    function alMirar(nodo, mirar) {
      nodo.addEventListener('focus', mirar);
      nodo.addEventListener('pointerenter', (ev) => { if (ev.pointerType === 'mouse') mirar(); });
    }
    /** Cuánto falta para que aparezca algo: un punto por noche, «2 de 5 noches» y qué lo hace aparecer. */
    function progresoDe(hay, minimo, texto) {
      const c = el('div', 'sn-progreso');
      const puntos = el('span', 'sn-progreso-puntos');
      for (let i = 0; i < minimo; i++) puntos.appendChild(el('i', i < hay ? 'lleno' : null));
      c.append(puntos, el('b', null, u.plural('sueno.vacio.progreso', minimo, { a: Math.min(hay, minimo) })));
      if (texto) c.appendChild(el('p', null, texto));
      return c;
    }

    function pintar() {
      const arriba = cont.scrollTop;
      cont.innerHTML = '';
      const huella = `${s.clave}|${s.estado}|${sinReloj()}`;
      animar = huella !== s.dibujada && !quieto();
      s.dibujada = huella;
      const hoy = u.partes(Datos.HOY);
      const cab = el('header', 'pg-cab');
      cab.append(el('div', 'pg-fecha', tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) })), el('h2', 'pg-titulo', tx('sueno.titulo')));
      cont.appendChild(cab);
      const conNoches = hayNoches();
      // Sin noches, primero lo que hace que aparezcan; la pregunta de la mañana va después.
      if (!conNoches) cont.appendChild(invitacion());
      manana().forEach((nodo) => cont.appendChild(nodo));
      cont.appendChild(tira());
      // Poco sueño por semanas: la sugerencia de un médico, arriba (Sueno.pocoSuenoSostenido).
      if (s.poco || Sueno.pocoSuenoSostenido(ultimas(Datos.HOY))) cont.appendChild(pocoSueno());
      // Con Ascent, la recuperación de hoy también vive acá: cruza justo el sueño con el entrenamiento.
      const rec = s.clave === Datos.HOY && conNoches && opciones.recuperacion ? opciones.recuperacion() : null;
      if (rec) cont.appendChild(recuperacion(rec));
      const noche = noches().find((n) => n.clave === s.clave) || null;
      if (conNoches) cont.appendChild(noche ? (noche.moss ? laNocheDeMoss(noche) : laNoche(noche)) : sinNoche(s.clave));
      if (noche && noche.moss && !conMovimiento) cont.appendChild(cartaDeMovimiento());
      // La deuda va segunda: solo necesita cuánto dormiste, así que es lo que más gente tiene bien.
      cont.appendChild(deuda());
      if (noche || !conNoches) cont.appendChild(calidad(noche));
      cont.appendChild(horario());
      if (!noche || !noche.moss) { if (noche || !conNoches) cont.appendChild(vitales(noche)); } else cont.appendChild(vitalesSinReloj());
      if (sinReloj() || !conNoches) {
        const avisar = avisoDelCargador();
        if (avisar) cont.appendChild(avisar);
        cont.appendChild(afinar());
      }
      cont.appendChild(fuentes(noche));
      cont.appendChild(el('p', 'sn-pie', tx('sueno.noMedico')));
      cont.scrollTop = arriba;
    }

    /** Pasa de un estado a otro con un fundido, en vez de cambiar todo de golpe. */
    function ponerEstado(estado) {
      if (estado === s.estado) return;
      const cambiar = () => {
        Object.assign(s, { estado, clave: Datos.HOY, editando: null, lectura: {}, abierto: null, conIphone: false });
        ahoraNo.clear();
        pintar();
        cont.scrollTop = 0;
        if (opciones.alCambiarEstado) opciones.alCambiarEstado(estado);
      };
      if (quieto()) { cambiar(); return; }
      cont.classList.add('sn-fundiendo');
      setTimeout(() => { cambiar(); cont.classList.remove('sn-fundiendo'); }, 180);
    }

    function pocoSueno() {
      const c = carta('sn-poco', tx('sueno.pocoSueno.titulo'));
      c.append(el('p', 'pg-texto', tx('sueno.pocoSueno.texto')), el('p', 'sn-poco-nota', tx('sueno.pocoSueno.nota')));
      return c;
    }

    // ------------------------------------------------------------ sin noches: la invitación
    // Un ejemplo de lo que va a ver, marcado como ejemplo, y las dos formas de que aparezca, con qué
    // hay que hacer en cada una. Conectar Salud, en la galería, trae las noches de la persona de mentira.
    function invitacion() {
      const c = carta('sn-heroe sn-invita', tx('sueno.vacio.arriba'), chipDeEjemplo());
      const ej = muestra().filter(Boolean).pop();
      c.appendChild(arcoDe(ej, { lista: muestra(), centro: [u.duracion(Math.round(ej.dormido)), tx('sueno.dormido')] }));
      c.appendChild(el('h3', 'sn-invita-titulo', tx('sueno.vacio.titulo')));
      c.appendChild(el('p', 'sn-invita-texto', tx('sueno.vacio.texto')));
      const caminos = el('div', 'sn-caminos');
      const conReloj = el('div', 'sn-camino');
      conReloj.innerHTML = icono('reloj3');
      conReloj.append(el('b', null, tx('sueno.vacio.conReloj.titulo')), el('p', null, tx('sueno.vacio.conReloj.texto')), boton('sn-permitir', tx('sueno.vacio.conReloj.boton'), () => {
        if (opciones.ponerAparato) opciones.ponerAparato(false);
        ponerEstado('datos');
      }));
      const conIphone = el('div', 'sn-camino');
      conIphone.innerHTML = icono('telefono');
      conIphone.append(el('b', null, tx('sueno.vacio.sinReloj.titulo')), el('p', null, tx('sueno.vacio.sinReloj.texto')));
      if (s.conIphone) {
        const listo = el('div', 'sn-camino-listo');
        listo.innerHTML = LISTO;
        listo.append(tx('sueno.vacio.sinReloj.listo'));
        conIphone.appendChild(listo);
        // Solo en la galería: la mañana no se puede adelantar en la app.
        conIphone.appendChild(boton('sn-simular', '(galería) La mañana siguiente', () => {
          if (opciones.ponerAparato) opciones.ponerAparato(true);
          ponerEstado('una');
        }));
      } else {
        conIphone.appendChild(boton('sn-otra', tx('sueno.vacio.sinReloj.boton'), (ev) => {
          colapsar(ev.currentTarget, () => {
            s.conIphone = true;
            conMovimiento = true;
            pintar();
          }, 260);
        }));
      }
      caminos.append(conReloj, conIphone);
      c.appendChild(caminos);
      return c;
    }

    // ------------------------------------------------------------ la pregunta de la mañana
    // Arriba, cada día, hasta que contestes o toques «Ahora no»: cómo dormiste anoche, con cinco caras
    // de línea. Un toque y listo; después queda una línea para cambiarla.
    const BOCA = [-3.4, -1.8, 0, 1.8, 3.4];
    function caraSvg(k) {
      const y = k < 3 ? 5.4 : 4.2;
      return `<svg class="sn-cara-dibujo" viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10.4"/><circle cx="-3.6" cy="-2.4" r="1.05" class="ojo"/><circle cx="3.6" cy="-2.4" r="1.05" class="ojo"/><path d="M -4.6 ${y} Q 0 ${(y + BOCA[k - 1]).toFixed(1)} 4.6 ${y}"/></svg>`;
    }
    function manana() {
      const clave = Datos.HOY;
      const cara = caras[clave];
      const nombres = tx('sueno.manana.caras');
      const hora = ahoraNo.has(clave) ? null : queHora(clave);
      const conCaras = (!cara && !ahoraNo.has(clave)) || s.cambiando;
      const nodos = [];
      if (hora || conCaras) {
        const c = carta('sn-manana' + (s.mananaVista ? ' sn-quieta' : ''), null);
        c.classList.remove('sn-entra');
        s.mananaVista = true;
        if (hora) c.appendChild(bloqueDeHora(clave, hora));
        if (conCaras) {
          const bloque = el('div', 'sn-caras-bloque');
          bloque.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.pregunta')));
          const fila = el('div', 'sn-caras');
          nombres.forEach((nombre, i) => {
            fila.appendChild(boton('sn-cara' + (cara === i + 1 ? ' elegida' : ''), caraSvg(i + 1) + `<span>${nombre}</span>`, () => ponerCara(clave, i + 1), nombre));
          });
          bloque.appendChild(fila);
          c.appendChild(bloque);
        }
        c.appendChild(boton('sn-ahora-no', tx('sueno.manana.ahoraNo'), () => {
          colapsar(c, () => {
            if (cara) s.cambiando = false;
            ahoraNo.add(clave);
            pintar();
          });
        }));
        nodos.push(c);
      }
      if (!hora && !conCaras) s.mananaVista = false;
      if (cara && !s.cambiando) {
        const c = el('div', 'sn-manana-hecha' + (s.hechaVista ? ' sn-quieta' : ''));
        s.hechaVista = true;
        c.innerHTML = caraSvg(cara);
        c.append(el('span', null, tx('sueno.manana.respondida', { cara: nombres[cara - 1].toLowerCase() })),
          boton('sn-manana-cambiar', tx('sueno.manana.cambiar'), () => {
            // La línea se apaga y la tarjeta entra creciendo (ver .sn-manana en la página).
            c.classList.add('saliendo');
            s.hechaVista = false;
            setTimeout(() => { s.cambiando = true; ahoraNo.delete(clave); pintar(); }, 200);
          }));
        nodos.push(c);
      }
      return nodos;
    }

    // ------------------------------------------------------------ las dos semanas, para elegir
    function tira() {
      // Las dos semanas que terminan hoy o, si la noche elegida es más vieja, las de alrededor.
      const fin = s.clave > Fechas.sumarDias(Datos.HOY, -DIAS) ? Datos.HOY : Fechas.sumarDias(s.clave, 6);
      // Elegir otra noche de las mismas catorce no vuelve a hacer crecer las barras.
      const firma = `${fin}|${s.estado}|${sinReloj()}`;
      const nueva = firma !== s.tiraDibujada && !quieto();
      s.tiraDibujada = firma;
      const caja = el('div', 'sn-noches' + (nueva ? ' sn-entra sn-animar' : ''));
      const lista = ultimas(fin);
      const nec = necesidad();
      const maximo = Math.max(nec + 60, ...lista.filter(Boolean).map((n) => n.dormido + n.siestas));
      // Antes de la primera noche no falta nada: todavía no estabas.
      const primera = noches().length ? noches()[0].clave : null;
      lista.forEach((n, i) => {
        const clave = Fechas.sumarDias(fin, i - DIAS + 1);
        const p = u.partes(clave);
        const soloCama = !n && soloEnCama(clave);
        const antes = !n && !soloCama && (!primera || clave < primera);
        const llego = n && n.dormido + n.siestas >= nec;
        const b = boton('sn-noche' + (clave === s.clave ? ' elegida' : '') + (n ? (n.moss ? ' moss ' + n.moss.origen : '') : soloCama ? ' cama' : antes ? ' vacia antes' : ' vacia') + (llego ? ' llego' : ''), '', () => {
          s.clave = clave;
          s.editando = null;
          pintar();
        });
        // Antes de la primera noche no hay nada que mirar: todavía no estabas.
        if (antes) b.disabled = true;
        const barra = el('div', 'sn-noche-barra');
        const relleno = el('i');
        relleno.style.setProperty('--i', String(i));
        relleno.style.height = n ? `${Math.max(6, (n.dormido / maximo) * 100).toFixed(1)}%` : soloCama ? `${Math.max(6, (soloCama.minutos / maximo) * 100).toFixed(1)}%` : '100%';
        barra.appendChild(relleno);
        const meta = el('span', 'sn-noche-meta');
        meta.style.bottom = `${((nec / maximo) * 100).toFixed(1)}%`;
        barra.appendChild(meta);
        b.append(barra, el('span', 'cm-tira-letra', tx('fecha.diasCortos.' + p.dia).charAt(0)), el('b', null, String(p.num)));
        b.setAttribute('aria-label', u.fechaLarga(clave));
        caja.appendChild(b);
      });
      if (!noches().length) caja.appendChild(el('p', 'sn-noches-nota', tx('sueno.vacio.tira')));
      else if (pocasNoches()) caja.appendChild(el('p', 'sn-noches-nota', u.plural('sueno.vacio.tiraPocas', noches().length)));
      return caja;
    }

    function recuperacion(r) {
      const c = carta('sn-recuperacion', tx('ascent.recuperacion.titulo'), el('em', 'sn-con-ascent', tx('ascent.conAscent')));
      const fila = boton('sn-rec-fila', '', () => opciones.abrirAscent());
      fila.append(el('b', null, String(r.total)), el('span', null, tx('ascent.recuperacion.conviene.' + r.conviene)));
      fila.insertAdjacentHTML('beforeend', icono('adelante'));
      c.appendChild(fila);
      // Debajo, el rendimiento esperado de hoy (spec/rendimiento.md).
      const rend = opciones.rendimiento ? opciones.rendimiento() : null;
      if (rend) c.appendChild(el('p', 'sn-nota', tx('ascent.rendimiento.enSueno', { categoria: tx('ascent.rendimiento.categorias.' + rend.categoria.max) })));
      return c;
    }

    // ------------------------------------------------------------ el arco de la noche
    /** Un trazo del arco: `a0` y `a1` en radianes, de π (izquierda) a 2π (derecha), pasando por arriba. */
    const puntoDelArco = (r, a) => `${(ARCO.cx + r * Math.cos(a)).toFixed(2)} ${(ARCO.cy + r * Math.sin(a)).toFixed(2)}`;
    const trazoDelArco = (r, a0, a1) => `M${puntoDelArco(r, a0)} A${r} ${r} 0 0 1 ${puntoDelArco(r, a1)}`;
    /**
     * La noche en un arco: la izquierda es cuando te dormiste, la derecha cuando te despertaste y cada
     * etapa va en su carril, con las horas alrededor. Sin etapas, un solo trazo; con un rango, con los
     * bordes esfumados del ancho de la duda; sin nada, punteado. Devuelve un nodo con lo del centro.
     * La escala sale de las noches de `lista`: cada hora queda en su lugar de una noche a otra, y una
     * noche corta se ve corta.
     */
    function arcoDe(n, { centro, rango, chico, lista } = {}) {
      const caja = el('div', 'sn-arco');
      const finTramos = n && n.tramos.length ? Math.max(...n.tramos.map((t) => t.hasta)) : n ? n.despertar : 0;
      const todas = n ? [...(lista || []).filter(Boolean), n] : [];
      const desde = n ? Math.floor((Math.min(...todas.map((x) => x.dormirse), ...(rango ? [rango.dormirse[0]] : [])) - 15) / 60) * 60 : 0;
      const hasta = n ? Math.ceil((Math.max(...todas.map((x) => x.despertar), finTramos, ...(rango ? [rango.despertar[1]] : [])) + 15) / 60) * 60 : 0;
      const pi = Math.PI;
      const ang = (m) => pi + ((Math.min(hasta, Math.max(desde, m)) - desde) / Math.max(1, hasta - desde)) * pi;
      const id = 'sn' + Math.random().toString(36).slice(2, 8);
      const { ancho, alto, cx, cy } = ARCO;
      // Un cielo de dentro: del azul de la noche al de la mañana, con unas pocas estrellas.
      const r0 = 104;
      const azar = Datos.azar(7);
      let estrellas = '';
      for (let i = 0; i < 16; i++) {
        const a = pi + 0.12 + azar() * (pi - 0.24), dist = 62 + azar() * 38;
        estrellas += `<circle class="estrella" cx="${(cx + dist * Math.cos(a)).toFixed(1)}" cy="${(cy + dist * Math.sin(a)).toFixed(1)}" r="${(0.5 + azar() * 0.55).toFixed(2)}" opacity="${(0.25 + azar() * 0.45).toFixed(2)}"/>`;
      }
      let dentro = '';
      let carriles = '';
      if (!n) {
        dentro = `<path class="fantasma" d="${trazoDelArco(126, pi, 2 * pi)}"/>`;
      } else {
        // Las horas alrededor: una marca por hora y el número cada dos, salvo pegado a los extremos.
        const horas = [];
        for (let m = Math.ceil(desde / 60) * 60; m <= hasta; m += 60) horas.push(m);
        const marcas = horas.map((m) => {
          const a = ang(m);
          const larga = (18 + m / 60) % 2 === 0;
          const lejos = Math.min(a - pi, 2 * pi - a) > 0.24;
          if (Math.min(a - pi, 2 * pi - a) < 0.05) return '';
          const rEt = 153 + 6 * Math.abs(Math.cos(a));
          const texto = larga && lejos ? `<text x="${(cx + rEt * Math.cos(a)).toFixed(1)}" y="${(cy + rEt * Math.sin(a) + 3).toFixed(1)}">${String((18 + m / 60) % 24).padStart(2, '0')}</text>` : '';
          return `<path class="hito" d="M${puntoDelArco(145.5, a)} L${puntoDelArco(larga ? 149.5 : 147.5, a)}"/>${texto}`;
        }).join('');
        const tramo = (t, cual, ruta) => {
          const { r, w } = ruta || CARRILES[cual];
          // Con el borde redondo ocupando lo justo: lo corto queda como un punto.
          const borde = (w / 2 + 0.6) / r;
          const a0 = ang(t.desde) + borde, a1 = ang(t.hasta) - borde;
          const d = a1 > a0 ? trazoDelArco(r, a0, a1) : trazoDelArco(r, (a0 + a1) / 2, (a0 + a1) / 2 + 0.001);
          return `<path class="tramo e-${cual}" data-tramo="${n.tramos.indexOf(t)}" stroke-width="${w}" d="${d}"/>`;
        };
        const trazos = [];
        if (n.conEtapas) {
          Object.entries(CARRILES).forEach(([cual, { r, w }]) => { carriles += `<path class="pista" stroke-width="${w}" d="${trazoDelArco(r, pi, 2 * pi)}"/>`; });
          n.tramos.forEach((t) => trazos.push(tramo(t, t.etapa === 'dormido' ? 'nucleo' : t.etapa)));
        } else {
          // Sin etapas: lo dormido en un solo trazo ancho, y lo despierto (si lo hay) por fuera.
          const GRUESO = { r: 122, w: 18 };
          carriles += `<path class="pista" stroke-width="${GRUESO.w}" d="${trazoDelArco(GRUESO.r, pi, 2 * pi)}"/>`;
          // El color por hora: de la noche a la mañana, de izquierda a derecha.
          const PARADAS = [[0, [0x5a, 0x5f, 0xd0]], [0.5, [0x6b, 0x8f, 0xf0]], [1, [0xa8, 0xe2, 0xf0]]];
          const colorEn = (x) => {
            const f = Math.min(1, Math.max(0, (x - (cx - GRUESO.r)) / (2 * GRUESO.r)));
            const [p, q] = f < 0.5 ? [PARADAS[0], PARADAS[1]] : [PARADAS[1], PARADAS[2]];
            const k = (f - p[0]) / (q[0] - p[0]);
            return `rgb(${p[1].map((v, i) => Math.round(v + (q[1][i] - v) * k)).join(',')})`;
          };
          dentro += `<linearGradient id="${id}t" gradientUnits="userSpaceOnUse" x1="${cx - GRUESO.r}" x2="${cx + GRUESO.r}" y1="0" y2="0"><stop offset="0" stop-color="${colorEn(cx - GRUESO.r)}"/><stop offset="0.5" stop-color="${colorEn(cx)}"/><stop offset="1" stop-color="${colorEn(cx + GRUESO.r)}"/></linearGradient>`;
          const borde = rango ? 0 : (GRUESO.w / 2 + 0.6) / GRUESO.r;
          const a = (rango ? ang(rango.dormirse[1]) : ang(n.dormirse)) + borde, b = (rango ? ang(rango.despertar[0]) : ang(n.despertar)) - borde;
          // Los bordes de la duda, esfumados a lo largo del arco: cada uno es corto, así que alcanza un degradé recto.
          const esfumar = (x0, x1, de, hasta2, cual) => {
            if (x1 <= x0) return;
            const px = (x) => cx + GRUESO.r * Math.cos(x), py = (x) => cy + GRUESO.r * Math.sin(x);
            dentro += `<linearGradient id="${id}${cual}" gradientUnits="userSpaceOnUse" x1="${px(x0).toFixed(2)}" y1="${py(x0).toFixed(2)}" x2="${px(x1).toFixed(2)}" y2="${py(x1).toFixed(2)}"><stop offset="0" stop-color="${colorEn(px(x0))}" stop-opacity="${de}"/><stop offset="1" stop-color="${colorEn(px(x1))}" stop-opacity="${hasta2}"/></linearGradient>`;
            trazos.push(`<path class="grueso" stroke="url(#${id}${cual})" stroke-width="${GRUESO.w}" d="${trazoDelArco(GRUESO.r, x0, x1)}"/>`);
          };
          if (rango) { esfumar(ang(rango.dormirse[0]), a + 0.008, 0, 1, 'a'); esfumar(b - 0.008, ang(rango.despertar[1]), 1, 0, 'b'); }
          trazos.push(`<path class="grueso${rango ? '' : ' redondo'}" stroke="url(#${id}t)" stroke-width="${GRUESO.w}" d="${trazoDelArco(GRUESO.r, a, b)}"/>`);
          n.tramos.filter((t) => t.etapa === 'despierto').forEach((t) => trazos.push(tramo(t, 'despierto')));
        }
        const revela = `<path class="revela${animar ? ' animar' : ''}" pathLength="1" stroke-width="64" d="${trazoDelArco(126, pi, 2 * pi)}"/>`;
        dentro += `<mask id="${id}m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="${ancho + 20}" height="${alto + 40}">${revela}</mask>${marcas}${carriles}<g mask="url(#${id}m)">${trazos.join('')}</g>`;
      }
      const svg = `<svg viewBox="0 0 ${ancho} ${alto}" aria-hidden="true">
        <defs><linearGradient id="${id}c" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6a5fd6" stop-opacity="0.26"/><stop offset="0.55" stop-color="#6b8ff0" stop-opacity="0.14"/><stop offset="1" stop-color="#a8e2f0" stop-opacity="0.22"/></linearGradient></defs>
        <path fill="url(#${id}c)" stroke="none" d="M${cx - r0} ${cy} A${r0} ${r0} 0 0 1 ${cx + r0} ${cy} Z"/>${estrellas}
        <line class="horizonte" x1="4" x2="${ancho - 4}" y1="${cy + 1}" y2="${cy + 1}"/>${dentro}</svg>`;
      caja.innerHTML = svg;
      if (centro) {
        const medio = el('div', 'sn-arco-centro' + (chico ? ' chico' : ''));
        medio.append(el('b', null, centro[0]));
        if (centro[1]) medio.appendChild(el('span', null, centro[1]));
        caja.appendChild(medio);
        if (n && n.conEtapas) lecturaDelArco(caja, medio, n, centro, desde, hasta);
      }
      return caja;
    }
    /**
     * Tocar el arco lee esa etapa en el centro (con el mouse, al pasar): de qué a qué hora y cuánto duró.
     * Se busca por la hora, no por el trazo: una etapa de cinco minutos es muy chica para acertarle.
     * Tocar lo mismo o afuera vuelve a la noche.
     */
    function lecturaDelArco(caja, medio, n, centro, desde, hasta) {
      const dibujo = caja.querySelector('svg');
      const grande = medio.querySelector('b'), abajo = medio.querySelector('span');
      const trazos = dibujo.querySelector('g[mask]');
      let elegido = -1;
      const mostrar = (i) => {
        if (i === elegido) return;
        elegido = i;
        trazos.querySelectorAll('.tramo').forEach((p) => p.classList.toggle('leida', Number(p.dataset.tramo) === i));
        trazos.classList.toggle('leyendo', i >= 0);
        const t = n.tramos[i];
        grande.textContent = t ? (t.etapa === 'dormido' ? tx('sueno.dormido') : tx('sueno.etapas.' + t.etapa)) : centro[0];
        abajo.textContent = t ? `${reloj(t.desde)} – ${reloj(t.hasta)} · ${u.duracion(Math.max(1, Math.round(t.hasta - t.desde)))}` : centro[1];
        medio.classList.remove('cambia');
        void medio.offsetWidth;
        medio.classList.add('cambia');
      };
      const tramoEn = (ev) => {
        const r = dibujo.getBoundingClientRect();
        const x = ((ev.clientX - r.left) / r.width) * ARCO.ancho - ARCO.cx, y = ((ev.clientY - r.top) / r.height) * ARCO.alto - ARCO.cy;
        const lejos = Math.hypot(x, y);
        // Solo en la corona de los carriles: el medio y lo de afuera no leen nada.
        if (y > 0 || lejos < 100 || lejos > 152) return -1;
        const a = Math.atan2(y, x) + 2 * Math.PI;
        const m = desde + ((a - Math.PI) / Math.PI) * (hasta - desde);
        return n.tramos.findIndex((t) => m >= t.desde && m <= t.hasta);
      };
      let conMouse = false;
      caja.addEventListener('pointerdown', (ev) => { conMouse = ev.pointerType === 'mouse'; });
      caja.addEventListener('click', (ev) => { if (conMouse) return; const i = tramoEn(ev); mostrar(i === elegido ? -1 : i); });
      caja.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse') mostrar(tramoEn(ev)); });
      caja.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') mostrar(-1); });
    }
    /** Debajo del arco, a cada lado, a qué hora te dormiste y te despertaste. */
    function horasDelArco(a, b) {
      const fila = el('div', 'sn-arco-horas');
      const una = (clase, ic, hora, texto) => {
        const h = el('div', 'sn-arco-hora ' + clase);
        h.innerHTML = ic;
        h.append(el('b', null, hora), el('small', null, texto));
        return h;
      };
      fila.append(una('inicio', icono('sueno'), a, tx('sueno.manana.teDormiste')), una('fin', SOL, b, tx('sueno.manana.teDespertaste')));
      return fila;
    }

    // ------------------------------------------------------------ la noche
    function titulo(clave) {
      if (clave === Datos.HOY) return tx('sueno.anoche');
      const p = u.partes(clave), antes = u.partes(Fechas.sumarDias(clave, -1));
      return tx('sueno.nocheDel', { desde: tx('fecha.dias.' + antes.dia), hasta: tx('fecha.dias.' + p.dia) });
    }

    function laNoche(n) {
      const c = carta('sn-heroe', titulo(n.clave), confianza(n.confianza.duracion));
      const arco = arcoDe(n, { lista: ultimas(n.clave), centro: [u.duracion(Math.round(n.dormido)), tx('sueno.dormido')] });
      arco.setAttribute('role', 'img');
      arco.setAttribute('aria-label', tx('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) }));
      c.append(arco, horasDelArco(reloj(n.dormirse), reloj(n.despertar)));
      if (Sueno.pareceIncompleta(n, anterioresA(n.clave))) c.appendChild(el('p', 'pg-aviso', tx('sueno.incompleta')));
      if (n.conEtapas) {
        // Las etapas, como estimación: cuánto de cada una, en la barra y con su nombre.
        const partes = [['rem', n.etapas.rem], ['nucleo', n.etapas.nucleo], ['profundo', n.etapas.profundo]];
        const proporcion = el('div', 'sn-proporcion');
        partes.forEach(([e, min]) => { const i = el('i', 'sn-' + e); i.style.flex = `${Math.max(1, min)} 1 0`; proporcion.appendChild(i); });
        c.appendChild(proporcion);
        const etapas = el('div', 'sn-etapas');
        partes.forEach(([e, min]) => {
          const x = el('div', 'sn-etapa sn-' + e);
          x.append(el('i'), el('span', null, tx('sueno.etapas.' + e)), el('b', null, u.duracion(Math.round(min))), el('small', null, `${numero(Math.round((min / n.dormido) * 100))} %`));
          etapas.appendChild(x);
        });
        c.appendChild(etapas);
      }
      c.appendChild(el('p', 'sn-nota', n.conEtapas ? tx('sueno.etapasEstimadas') : tx('sueno.sinEtapas')));
      // Despierto y en cama.
      const datos = el('div', 'sn-datos');
      const dato = (clave, valor, nivel) => {
        const d = el('div', 'sn-dato');
        const nombre = el('span', null, tx(clave));
        if (clave === 'sueno.despierto') nombre.prepend(el('i', 'sn-clave-despierto'));
        d.append(nombre, el('b', null, valor));
        if (nivel) d.appendChild(confianza(nivel));
        datos.appendChild(d);
      };
      dato('sueno.despierto', `${u.duracion(Math.round(n.despierto))} · ${u.plural('sueno.despertares', n.despertares)}`, n.confianza.despertares);
      if (n.enCama) dato('sueno.enCama', `${u.duracion(n.enCama.minutos)} · ${n.enCama.fuente.nombre}`, n.confianza.enCama);
      if (n.siestas) dato('sueno.siesta', u.duracion(n.siestas), 'alta');
      c.appendChild(datos);
      return c;
    }

    // Sin reloj: cuánto y cuándo, de dónde sale la hora y, si es estimada, el rango con los bordes difusos.
    function laNocheDeMoss(n) {
      const m = n.moss;
      const c = carta('sn-heroe sn-moss', titulo(n.clave), el('em', 'sn-origen ' + m.origen, tx('sueno.origen.' + m.origen)));
      const r = m.rango;
      const arco = arcoDe(n, { lista: ultimas(n.clave), rango: r || undefined, centro: [u.duracion(Math.round(n.dormido)), tx('sueno.dormido')] });
      arco.setAttribute('role', 'img');
      arco.setAttribute('aria-label', tx('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) }));
      c.append(arco, horasDelArco(reloj(n.dormirse), reloj(n.despertar)));
      if (r) c.appendChild(el('p', 'pg-texto sn-rango-texto', `${tx('sueno.rango', { a: reloj(r.dormirse[0]), b: reloj(r.dormirse[1]), c: reloj(r.despertar[0]), d: reloj(r.despertar[1]) })} ${tx('sueno.seguridad.' + m.confianza)}.`));
      if (m.origen === 'estimada') {
        const yo = SinReloj.aprenderPersonal(propias(), n.clave);
        c.appendChild(el('p', 'sn-nota', tx('sueno.estimadaTexto', { latencia: yo.latencia, despertar: yo.alDespertar })));
      }
      c.appendChild(el('p', 'sn-nota', tx('sueno.sinRelojEtapas')));
      // Cambiar la hora de cualquier noche de Moss, ahí mismo.
      if (s.editando === n.clave) {
        const ed = editorDeHora(n.dormirse, n.despertar, (x, y, cambiadas) => {
          if (cambiadas || m.origen === 'estimada') ponerHora(n.clave, x, y, cambiadas ? 'corregida' : 'confirmada');
          s.editando = null;
          colapsar(ed, pintar, 380);
        });
        ed.classList.add('sn-editor-noche');
        c.appendChild(ed);
      } else {
        c.appendChild(boton('sn-cambiar-hora', tx('sueno.cambiarHora'), () => { s.editando = n.clave; pintar(); }));
      }
      return c;
    }

    function sinNoche(clave) {
      const c = carta('sn-heroe sn-sin', titulo(clave));
      const cama = soloEnCama(clave);
      c.appendChild(arcoDe(null, { centro: [tx('sueno.sinDatos')], chico: true }));
      c.appendChild(el('p', 'pg-texto', tx(cama ? 'sueno.sinRelojTexto' : 'sueno.sinNadaTexto')));
      if (cama) {
        const datos = el('div', 'sn-datos');
        const d = el('div', 'sn-dato');
        d.append(el('span', null, tx('sueno.enCama')), el('b', null, `${u.duracion(cama.minutos)} · ${cama.fuente.nombre}`), confianza('baja'));
        datos.appendChild(d);
        c.appendChild(datos);
      }
      c.appendChild(el('p', 'sn-nota', tx('sueno.habitosPendientes')));
      // Lo que falló tiene arreglo: qué mirar si el aparato no mandó la noche.
      if (!sinReloj()) c.appendChild(boton('sn-enlace', `<span>${tx('sueno.vacio.noLlego')}</span>${icono('adelante')}`, () => opciones.abrirAparatos && opciones.abrirAparatos()));
      return c;
    }

    // ------------------------------------------------------------ la calidad
    /**
     * El anillo de la calidad: una vuelta partida en lo que puede sumar cada parte, cada una llena hasta
     * lo que sumó. Sin una parte, las otras ocupan toda la vuelta: el mismo cálculo que el puntaje parcial.
     */
    function anilloDe(q) {
      const caja = el('div', 'sn-anillo' + (q ? '' : ' fantasma'));
      const R = 44, largo = 2 * Math.PI * R, separa = 3.4;
      if (!q) {
        caja.innerHTML = `<svg viewBox="0 0 108 108" aria-hidden="true"><circle class="pista" cx="54" cy="54" r="${R}"/></svg>`;
        return caja;
      }
      const presentes = ['duracion', 'horario', 'continuidad'].filter((p) => q.partes[p] != null);
      const total = presentes.reduce((t, p) => t + Sueno.MAXIMOS[p], 0);
      let va = 0, pistas = '';
      const llenos = [];
      presentes.forEach((p) => {
        const parte = (Sueno.MAXIMOS[p] / total) * largo;
        const dibujo = parte - separa;
        pistas += `<circle class="pista" cx="54" cy="54" r="${R}" stroke-dasharray="${dibujo.toFixed(2)} ${(largo - dibujo).toFixed(2)}" stroke-dashoffset="${(-va).toFixed(2)}"/>`;
        llenos.push({ parte: p, dibujo: (dibujo * q.partes[p]) / Sueno.MAXIMOS[p], desde: va });
        va += parte;
      });
      caja.innerHTML = `<svg viewBox="0 0 108 108" aria-hidden="true">${pistas}${llenos.map((l) => `<circle class="lleno p-${l.parte}" cx="54" cy="54" r="${R}" stroke-dasharray="${(animar ? 0 : l.dibujo).toFixed(2)} ${largo.toFixed(2)}" stroke-dashoffset="${(-l.desde).toFixed(2)}"/>`).join('')}</svg>`;
      if (animar) requestAnimationFrame(() => requestAnimationFrame(() => caja.querySelectorAll('.lleno').forEach((c, i) => c.setAttribute('stroke-dasharray', `${llenos[i].dibujo.toFixed(2)} ${largo.toFixed(2)}`))));
      const centro = el('div', 'sn-anillo-centro');
      centro.appendChild(el('b', null, String(q.puntos)));
      caja.appendChild(centro);
      return caja;
    }
    function calidad(n) {
      const conNoches = hayNoches();
      const noche = n || muestra().filter(Boolean).pop();
      const q = Sueno.calidadDeNoche(noche, necesidad(), conNoches ? anterioresA(noche.clave) : Sueno.ultimasNoches(Datos.NOCHES, Fechas.sumarDias(noche.clave, -1), DIAS));
      // La palabra arriba, como en el horario; verde solo la de una noche buena.
      const chipDeLaPalabra = () => el('em', 'in-estado ' + (q.puntos >= 70 ? 'buena' : 'floja'), tx('sueno.palabras.' + q.palabra) + (q.parcial ? ` · ${tx('sueno.parcial')}` : ''));
      const c = carta('sn-calidad', tx('sueno.calidad'), !conNoches ? chipDeEjemplo() : q ? chipDeLaPalabra() : null);
      if (!q) {
        const fila = el('div', 'sn-calidad-fila');
        fila.append(anilloDe(null), el('p', 'pg-texto', tx(noche.moss ? 'sueno.sinCalidadEstimada' : 'sueno.sinCalidad')));
        c.appendChild(fila);
        return c;
      }
      const fila = el('div', 'sn-calidad-fila' + (conNoches ? '' : ' sn-muestra'));
      const lado = el('div', 'sn-calidad-lado');
      const partes = el('div', 'sn-partes');
      const previas = conNoches ? anterioresA(noche.clave).filter((x) => x && x.confianza.horario !== 'baja').length : 0;
      [['duracion', q.partes.duracion], ['horario', q.partes.horario], ['continuidad', q.partes.continuidad]].forEach(([parte, puntos]) => {
        const x = el('div', 'sn-parte sn-parte-' + parte);
        const max = Sueno.MAXIMOS[parte];
        const barra = el('i', 'sn-parte-barra');
        const relleno = el('i');
        barra.appendChild(relleno);
        if (puntos != null) {
          if (animar) requestAnimationFrame(() => { relleno.style.width = `${((puntos / max) * 100).toFixed(1)}%`; });
          else relleno.style.width = `${((puntos / max) * 100).toFixed(1)}%`;
        }
        // Lo que todavía no entra dice cuánto falta, con sus puntos.
        const faltaHorario = parte === 'horario' && puntos == null;
        const falta = parte === 'continuidad' && noche.moss ? tx('sueno.sinRelojParte') : faltaHorario ? u.plural('sueno.vacio.progreso', Sueno.MINIMOS.horarioDeLaCalidad, { a: previas }) : tx('sueno.todaviaNo');
        x.append(el('span', null, tx('sueno.partes.' + parte)), el('b', null, puntos == null ? falta : `${puntos} / ${max}`));
        if (faltaHorario) {
          const pts = el('span', 'sn-progreso-puntos');
          for (let i = 0; i < Sueno.MINIMOS.horarioDeLaCalidad; i++) pts.appendChild(el('i', i < previas ? 'lleno' : null));
          x.appendChild(pts);
        } else x.appendChild(barra);
        partes.appendChild(x);
      });
      lado.appendChild(partes);
      fila.append(anilloDe(q), lado);
      c.appendChild(fila);
      if (!conNoches) {
        c.appendChild(progresoDe(0, 1, tx('sueno.vacio.calidad')));
        return c;
      }
      // Lo que dijiste a la mañana va aparte: no cambia el puntaje de la noche, sí la recuperación.
      const cara = caras[noche.clave];
      if (cara) {
        const datos = el('div', 'sn-datos');
        const d = el('div', 'sn-dato');
        d.append(el('span', null, tx('sueno.manana.tuRespuesta')), el('b', null, tx('sueno.manana.caras')[cara - 1]));
        datos.appendChild(d);
        c.appendChild(datos);
      }
      const [enlace, caja] = desplegable('calidad', (k) => {
        tx('sueno.comoCalidad').forEach((p) => k.appendChild(el('p', null, p.replace('{necesidad}', u.duracion(necesidad())))));
        k.appendChild(el('p', null, tx('sueno.manana.nota')));
      });
      c.append(enlace, caja);
      return c;
    }

    // ------------------------------------------------------------ el horario
    function horario() {
      const conNoches = hayNoches();
      const lista = conNoches ? ultimas(s.clave) : muestra();
      const fin = conNoches ? s.clave : Datos.HOY;
      const h = Sueno.horario(lista);
      const estadoReg = h && (h.regularidad === 'muyRegular' || h.regularidad === 'regular') ? 'enCamino' : 'despacio';
      const c = carta('sn-horario', tx('sueno.horario'), !conNoches ? chipDeEjemplo() : h ? el('em', 'in-estado ' + estadoReg, tx('sueno.regularidad.' + h.regularidad)) : null);
      const medidas = lista.filter(Boolean);
      // De hora en punto a hora en punto; sin ninguna noche, de 22 a 8.
      const desde = medidas.length ? Math.floor((Math.min(...medidas.map((n) => n.dormirse)) - 15) / 60) * 60 : 4 * 60;
      const hasta = medidas.length ? Math.ceil((Math.max(...medidas.map((n) => n.despertar)) + 15) / 60) * 60 : 14 * 60;
      const X = (m) => ((m - desde) / (hasta - desde)) * 100;
      const g = el('div', 'sn-rangos' + (animar ? ' sn-animar' : '') + (conNoches ? '' : ' sn-muestra'));
      const guias = el('div', 'sn-guias');
      // Lo de siempre: la banda de tu hora ± cuánto se corre. Más angosta, más regular.
      if (h) {
        [[h.dormirse, h.desvioDormirse], [h.despertar, h.desvioDespertar]].forEach(([hora, desvio]) => {
          const banda = el('em');
          banda.style.left = `${X(hora - desvio).toFixed(2)}%`;
          banda.style.width = `${(X(hora + desvio) - X(hora - desvio)).toFixed(2)}%`;
          guias.appendChild(banda);
        });
      }
      const eje = el('div', 'sn-eje-horas');
      for (let m = Math.ceil(desde / 120) * 120; m <= hasta; m += 120) {
        const linea = el('i');
        linea.style.left = `${X(m).toFixed(2)}%`;
        guias.appendChild(linea);
        const et = el('span', X(m) < 4 ? 'pegada-izq' : X(m) > 96 ? 'pegada-der' : null, reloj(m));
        et.style.left = `${X(m).toFixed(2)}%`;
        eje.appendChild(et);
      }
      g.appendChild(guias);
      const lectura = el('div', 'sn-lectura');
      const textoDe = (n, clave) => (n ? `${diaCorto(clave)} · ${reloj(n.dormirse)} → ${reloj(n.despertar)} · ${u.duracion(Math.round(n.dormido))}` : `${diaCorto(clave)} · ${tx('sueno.graficos.sinDatos')}`);
      lista.forEach((n, i) => {
        const clave = Fechas.sumarDias(fin, i - DIAS + 1);
        const antes = !n && conNoches && (!noches().length || clave < noches()[0].clave);
        const mirar = () => {
          s.lectura.horario = clave;
          g.querySelectorAll('.sn-rango').forEach((x) => x.classList.toggle('tocada', x === fila));
          ponerLectura(lectura, textoDe(n, clave));
        };
        const fila = boton('sn-rango' + (n ? '' : ' vacia') + (antes ? ' antes' : '') + (clave === s.clave ? ' elegida' : '') + (clave === s.lectura.horario ? ' tocada' : ''), '', mirar);
        alMirar(fila, mirar);
        const pista = el('div', 'sn-rango-pista');
        if (n) {
          const barra = el('i');
          barra.style.setProperty('--i', String(i));
          barra.style.left = `${X(n.dormirse).toFixed(1)}%`;
          barra.style.width = `${(X(n.despertar) - X(n.dormirse)).toFixed(1)}%`;
          pista.appendChild(barra);
        }
        fila.append(el('span', null, tx('fecha.diasCortos.' + u.partes(clave).dia).charAt(0)), pista);
        fila.setAttribute('aria-label', textoDe(n, clave));
        g.appendChild(fila);
      });
      c.append(g, eje);
      if (h) {
        const leyenda = el('div', 'sn-leyenda sn-leyenda-banda');
        const clave = el('span');
        clave.append(el('i', 'banda'), tx('sueno.graficos.deSiempre'));
        leyenda.appendChild(clave);
        c.appendChild(leyenda);
      }
      // Lo de la última noche, o lo que se tocó.
      const elegida = s.lectura.horario && lista[DIAS - 1 - Fechas.diasEntre(s.lectura.horario, fin)] !== undefined ? s.lectura.horario : fin;
      lectura.textContent = textoDe(lista[DIAS - 1 - Fechas.diasEntre(elegida, fin)], elegida);
      if (medidas.length) c.appendChild(lectura);
      const seguras = medidas.filter((n) => n.confianza.horario !== 'baja').length;
      if (!conNoches) { c.appendChild(progresoDe(0, Sueno.MINIMOS.regularidad, tx('sueno.vacio.horario', { minimo: Sueno.MINIMOS.regularidad }))); return c; }
      if (!h) {
        const extra = medidas.length > seguras ? ` ${tx('sueno.pocoSegurasNoCuentan')}` : '';
        c.appendChild(progresoDe(seguras, Sueno.MINIMOS.regularidad, tx('sueno.vacio.horario', { minimo: Sueno.MINIMOS.regularidad }) + extra));
        return c;
      }
      const dos = el('div', 'sn-dos');
      [['sueno.dormirte', h.dormirse, h.desvioDormirse], ['sueno.despertarte', h.despertar, h.desvioDespertar]].forEach(([clave, hora, desvio]) => {
        const d = el('div');
        d.append(el('span', null, tx(clave)), el('b', null, reloj(hora)), el('small', null, tx('sueno.graficos.desvio', { n: Math.round(desvio) })));
        dos.appendChild(d);
      });
      c.appendChild(dos);
      if (h.finDeSemana != null && Math.abs(h.finDeSemana) >= 30) {
        const datos = el('div', 'sn-datos');
        const d = el('div', 'sn-dato');
        d.append(el('span', null, tx('sueno.finDeSemana')), el('b', null, tx(h.finDeSemana > 0 ? 'sueno.masTarde' : 'sueno.masTemprano', { t: u.duracion(Math.abs(Math.round(h.finDeSemana))) })));
        datos.appendChild(d);
        c.appendChild(datos);
      }
      const [enlace, caja] = desplegable('horario', (k) => k.appendChild(el('p', null, tx('sueno.regularidadTexto', { n: h.noches }))));
      c.append(enlace, caja);
      return c;
    }

    // ------------------------------------------------------------ la deuda
    /** El medidor: la deuda contra una noche entera de lo que necesitas; si pasa, cada marca es una noche más. */
    function medidor(minutos, nec, clase) {
      const m = el('div', 'sn-medidor ' + (clase || ''));
      const noches_ = Math.max(1, Math.ceil(minutos / nec));
      const tope = noches_ * nec;
      const pista = el('div', 'sn-medidor-pista');
      const lleno = el('i');
      const f = (minutos / tope).toFixed(3);
      if (animar) requestAnimationFrame(() => requestAnimationFrame(() => lleno.style.setProperty('--f', f)));
      else lleno.style.setProperty('--f', f);
      pista.appendChild(lleno);
      if (clase && clase.includes('pagada')) pista.appendChild(el('i', 'sn-medidor-cero'));
      for (let i = 1; i < noches_; i++) { const marca = el('em'); marca.style.left = `${((i / noches_) * 100).toFixed(1)}%`; pista.appendChild(marca); }
      const ejes = el('div', 'sn-medidor-ejes');
      ejes.append(el('span', null, tx('sueno.graficos.sinFaltar')), el('span', null, u.plural('sueno.graficos.medidorFin', noches_, { t: u.duracion(tope) })));
      m.append(pista, ejes);
      return m;
    }
    /** Lo que sumó o pagó cada noche: lo que faltó baja de la línea de lo que necesitas y lo que sobró sube. Pesan más las recientes, y por eso se ven más. */
    function barrasDeLaDeuda(lista, nec, fin) {
      const leyenda = el('div', 'sn-leyenda');
      const clave = (clase, texto) => { const x = el('span'); x.append(el('i', clase), texto); return x; };
      leyenda.append(clave('falta', tx('sueno.graficos.deMenos')), clave('sobra', tx('sueno.graficos.deMas')), clave('linea', tx('sueno.graficos.necesitas', { t: u.duracion(nec) })));
      const cuenta = (n) => n && n.confianza.duracion !== 'baja';
      // Lo que sobra paga hasta 2 horas (SOBRA_MAXIMA en sueno.ts): la barra se corta ahí.
      const difs = lista.map((n) => (cuenta(n) ? Math.min(120, n.dormido + n.siestas - nec) : null));
      const arriba = Math.max(30, ...difs.filter((d) => d != null && d > 0));
      const abajo = Math.max(30, ...difs.filter((d) => d != null && d < 0).map((d) => -d));
      const ALTO = 88;
      const linea = Math.round(ALTO * Math.min(0.72, Math.max(0.22, arriba / (arriba + abajo))));
      const escala = Math.min(linea / arriba, (ALTO - linea) / abajo);
      const dd = el('div', 'sn-dd' + (animar ? ' sn-animar' : ''));
      const lectura = el('div', 'sn-lectura');
      const textoDe = (n, c) => {
        const dia = diaCorto(c);
        if (!n) return `${dia} · ${tx('sueno.graficos.sinDatos')}`;
        const total = Math.round(n.dormido + n.siestas);
        if (!cuenta(n)) return `${dia} · ${u.duracion(total)} · ${tx('sueno.graficos.noCuenta')}`;
        const d = total - nec;
        const cola = Math.abs(d) < 5 ? tx('sueno.graficos.justo') : tx(d < 0 ? 'sueno.graficos.menos' : 'sueno.graficos.mas', { t: u.duracion(Math.abs(d)) });
        return `${dia} · ${u.duracion(total)} · ${cola}`;
      };
      lista.forEach((n, i) => {
        const c = Fechas.sumarDias(fin, i - DIAS + 1);
        const mirar = () => {
          dd.querySelectorAll('.sn-dd-col').forEach((x) => x.classList.toggle('elegida', x === col));
          ponerLectura(lectura, textoDe(n, c));
        };
        const col = boton('sn-dd-col' + (c === fin ? ' elegida' : ''), '', mirar);
        alMirar(col, mirar);
        const zonaCol = el('span', 'sn-dd-zona');
        const d = difs[i];
        // Antes de la primera noche no falta nada: todavía no estabas.
        const antes = d == null && !n && noches().length && c < noches()[0].clave;
        const marca = el('i', antes ? 'antes' : d == null ? 'nada' : d > 0 ? 'sobra' : 'falta');
        if (d == null) marca.style.top = `${linea}px`;
        else if (d > 0) { marca.style.bottom = `${ALTO - linea}px`; marca.style.height = `${Math.max(2, d * escala).toFixed(1)}px`; }
        else { marca.style.top = `${linea}px`; marca.style.height = `${Math.max(2, -d * escala).toFixed(1)}px`; }
        marca.style.setProperty('--i', String(i));
        // Anoche pesa entera y hace dos semanas casi nada (deudaDeSueno): la opacidad lo muestra.
        if (d != null) marca.style.setProperty('--o', (0.75 + 0.25 * ((i + 1) / DIAS)).toFixed(2));
        zonaCol.appendChild(marca);
        col.append(zonaCol, tx('fecha.diasCortos.' + u.partes(c).dia).charAt(0));
        col.setAttribute('aria-label', textoDe(n, c));
        dd.appendChild(col);
      });
      const meta = el('span', 'sn-dd-meta');
      meta.style.top = `${linea}px`;
      dd.appendChild(meta);
      lectura.textContent = textoDe(lista[DIAS - 1], fin);
      return [leyenda, dd, lectura];
    }
    function deuda() {
      const conNoches = hayNoches();
      const nec = necesidad();
      const lista = conNoches ? ultimas(s.clave) : muestra();
      const fin = conNoches ? s.clave : Datos.HOY;
      const d = Sueno.deudaDeSueno(lista, nec);
      const c = carta('sn-deuda', tx('sueno.deuda'), conNoches ? null : chipDeEjemplo());
      const seguras = lista.filter((n) => n && n.confianza.duracion !== 'baja').length;
      const hay = lista.filter(Boolean).length;
      const cifra = el('div', 'pg-cifra' + (conNoches ? '' : ' sn-muestra'));
      const sinDeuda = d && d.minutos < 15;
      if (d) {
        if (sinDeuda) {
          const b = el('b', 'sn-sin-deuda');
          b.innerHTML = `<i>${LISTO}</i>`;
          b.append(tx('sueno.sinDeuda'));
          cifra.appendChild(b);
        } else cifra.append(el('b', null, u.duracion(Math.round(d.minutos))), el('span', null, tx('sueno.deudaDe', { necesidad: u.duracion(nec) })));
        c.appendChild(cifra);
        c.appendChild(medidor(d.minutos, nec, (sinDeuda ? 'pagada' : '') + (conNoches ? '' : ' sn-muestra')));
      } else {
        // Con pocas noches: cuántas faltan, en vez de un número que todavía no se puede saber.
        cifra.append(el('b', null, u.plural('sueno.vacio.faltan', Sueno.MINIMOS.deuda - seguras)), el('span', null, tx('sueno.vacio.paraSaber')));
        c.appendChild(cifra);
      }
      const barras = barrasDeLaDeuda(lista, nec, fin);
      if (conNoches) c.append(...barras);
      else { const envoltura = el('div', 'sn-muestra'); envoltura.append(...barras); c.appendChild(envoltura); }
      if (!conNoches) { c.appendChild(progresoDe(0, Sueno.MINIMOS.deuda, tx('sueno.vacio.deuda', { minimo: Sueno.MINIMOS.deuda }))); return c; }
      if (!d) {
        const extra = hay > seguras ? ` ${tx('sueno.pocoSegurasNoCuentan')}` : '';
        c.appendChild(progresoDe(seguras, Sueno.MINIMOS.deuda, tx('sueno.vacio.deuda', { minimo: Sueno.MINIMOS.deuda }) + extra));
        return c;
      }
      c.appendChild(el('p', 'sn-nota', sinDeuda ? `${tx('sueno.graficos.alDia')} ${tx('sueno.deudaNoches', { n: d.noches, de: d.de })}.` : `${tx('sueno.deudaNoches', { n: d.noches, de: d.de })}.`));
      const [enlace, caja] = desplegable('deuda', (k) => k.appendChild(el('p', null, tx('sueno.deudaTexto'))));
      c.append(enlace, caja);
      return c;
    }

    // ------------------------------------------------------------ lo que mide el reloj de noche
    /** Las dos semanas de un valor en una línea chiquita; sin datos, un hueco. La raya es lo tuyo. */
    function chispa(valores, usual, rangoMinimo) {
      const W = 72, H = 26, m = 3.5;
      const hay = valores.map((v, i) => [v, i]).filter(([v]) => v != null);
      const n = document.createElementNS(Util.SVG, 'svg');
      n.setAttribute('viewBox', `0 0 ${W} ${H}`);
      n.setAttribute('class', 'sn-chispa');
      n.setAttribute('aria-hidden', 'true');
      if (!hay.length) return n;
      const todos = hay.map(([v]) => v).concat(usual != null ? [usual] : []);
      // Con un rango mínimo: que un latido de diferencia no parezca un salto.
      const medio = (Math.min(...todos) + Math.max(...todos)) / 2;
      const rango = Math.max(rangoMinimo, Math.max(...todos) - Math.min(...todos));
      const min = medio - rango / 2;
      const X = (i) => m + (i / (valores.length - 1)) * (W - 2 * m);
      const Y = (v) => m + (1 - (v - min) / rango) * (H - 2 * m);
      let d = '';
      valores.forEach((v, i) => {
        if (v == null) return;
        d += `${i && valores[i - 1] != null ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)} `;
      });
      const [ultimo, iUlt] = hay[hay.length - 1];
      const sueltos = hay.slice(0, -1).filter(([, i]) => valores[i - 1] == null && valores[i + 1] == null).map(([v, i]) => `<circle class="punto" cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="1.4"/>`).join('');
      n.innerHTML = `${usual != null ? `<line class="base" x1="${m}" x2="${W - m}" y1="${Y(usual).toFixed(1)}" y2="${Y(usual).toFixed(1)}"/>` : ''}<path class="trazo" d="${d}"/>${sueltos}<circle class="fin" cx="${X(iUlt).toFixed(1)}" cy="${Y(ultimo).toFixed(1)}" r="2.6"/>`;
      return n;
    }
    function vitales(n) {
      const conNoches = hayNoches();
      const noche = n || muestra().filter(Boolean).pop();
      const c = carta('sn-vitales', tx('sueno.vitales'), conNoches ? null : chipDeEjemplo());
      const fuentes_ = conNoches ? noches() : Datos.NOCHES;
      const antes = Sueno.ultimasNoches(fuentes_, Fechas.sumarDias(noche.clave, -1), DIAS);
      const dos = Sueno.ultimasNoches(fuentes_, noche.clave, DIAS);
      let tuyas = 0;
      const cuerpo = el('div', conNoches ? null : 'sn-muestra');
      const fila = (tipo, dec, rangoMinimo) => {
        const unidad = tx('sueno.unidad.' + tipo);
        const lecturas = Datos.LECTURAS[tipo];
        const anteriores = antes.filter(Boolean)
          .map((x) => Sueno.vitalDeNoche(tipo, lecturas, x, []))
          .filter(Boolean).map((v) => v.valor);
        tuyas = Math.max(tuyas, anteriores.length);
        const v = Sueno.vitalDeNoche(tipo, lecturas, noche, anteriores);
        const serie = dos.map((x) => { const y = x ? Sueno.vitalDeNoche(tipo, lecturas, x, []) : null; return y ? y.valor : null; });
        const d = el('div', 'sn-vital');
        const ic = el('i', 'sn-vital-icono');
        ic.innerHTML = icono(tipo === 'frecuencia' ? 'corazon' : tipo === 'variabilidad' ? 'onda' : 'pulmon');
        const textos = el('div', 'sn-vital-textos');
        const comp = el('em', 'sn-comparado ' + (v && v.comparado ? v.comparado : ''), v ? (v.comparado ? tx('sueno.comparado.' + v.comparado) : tx('sueno.aprendiendo')) : tx('sueno.pocasLecturas'));
        textos.append(el('span', null, tx('sueno.vital.' + tipo)), comp);
        d.append(ic, textos, chispa(serie, v ? v.usual : null, rangoMinimo), el('b', null, v ? `${numero(v.valor, dec)} ${unidad}` : '—'));
        cuerpo.appendChild(d);
      };
      fila('frecuencia', 0, 12);
      fila('variabilidad', 0, 30);
      fila('respiracion', 1, 3);
      // La frecuencia en reposo es del día entero: va aparte y lo dice.
      const reposo = Datos.LECTURAS.reposo.get(noche.clave);
      if (reposo) {
        const d = el('div', 'sn-vital sn-reposo');
        const ic = el('i', 'sn-vital-icono');
        ic.innerHTML = icono('corazon');
        const textos = el('div', 'sn-vital-textos');
        textos.append(el('span', null, tx('sueno.vital.reposo')), el('em', 'sn-comparado', tx('sueno.delDia')));
        const serie = Array.from({ length: DIAS }, (_, i) => { const clave = Fechas.sumarDias(noche.clave, i - DIAS + 1); return dos[i] ? Datos.LECTURAS.reposo.get(clave) ?? null : null; });
        d.append(ic, textos, chispa(serie, null, 12), el('b', null, `${reposo} ${tx('sueno.unidad.frecuencia')}`));
        cuerpo.appendChild(d);
      }
      c.appendChild(cuerpo);
      if (!conNoches) {
        c.appendChild(progresoDe(0, Sueno.MINIMOS.loTuyo, tx('sueno.vacio.vitales', { minimo: Sueno.MINIMOS.loTuyo })));
        c.appendChild(boton('sn-enlace', `<span>${tx('perfil.aparatos.cadaUno')}</span>${icono('adelante')}`, () => opciones.abrirAparatos && opciones.abrirAparatos()));
        return c;
      }
      // Hasta tener lo tuyo, cuántas noches faltan para comparar.
      if (tuyas < Sueno.MINIMOS.loTuyo) c.appendChild(progresoDe(tuyas, Sueno.MINIMOS.loTuyo, tx('sueno.vacio.loTuyo', { minimo: Sueno.MINIMOS.loTuyo })));
      c.appendChild(el('p', 'sn-nota', tx('sueno.vitalesTexto')));
      return c;
    }
    /** Sin reloj: lo que aparecería acá con uno, sin insistir. */
    function vitalesSinReloj() {
      const c = carta('sn-vitales sn-vitales-sin', tx('sueno.vitales'));
      c.appendChild(el('p', 'pg-texto', tx('sueno.vacio.vitalesSinReloj')));
      c.appendChild(boton('sn-enlace', `<span>${tx('perfil.aparatos.cadaUno')}</span>${icono('adelante')}`, () => opciones.abrirAparatos && opciones.abrirAparatos()));
      return c;
    }

    // ------------------------------------------------------------ de dónde sale cada dato
    function fuentes(n) {
      const c = carta('sn-fuentes', tx('sueno.fuentes'));
      if (!hayNoches()) {
        c.appendChild(el('p', 'pg-texto', tx('sueno.vacio.precision')));
        const niveles = el('ul', 'sn-fuentes-lista sn-niveles');
        [[1, 'telefono'], [3, 'reloj3'], [4, 'reloj3']].forEach(([nivel, ic]) => {
          const li = el('li');
          const nombre = el('span', 'sn-fuente');
          nombre.innerHTML = icono(ic);
          nombre.append(tx('sueno.precision.niveles')[nivel]);
          const puntos = el('span', 'sn-puntos');
          for (let i = 1; i <= 5; i++) puntos.appendChild(el('i', i <= nivel ? 'lleno' : null));
          li.append(nombre, puntos);
          niveles.appendChild(li);
        });
        c.append(niveles, el('p', 'sn-nota', tx('sueno.vacio.fuentes')));
        return c;
      }
      // La precisión de la noche, de 0 a 5 (spec/aparatos.md): con un reloj, 4; sin reloj, 1.
      const conLoDeLaNoche = !!(n && !n.moss && Sueno.vitalDeNoche('frecuencia', Datos.LECTURAS.frecuencia, n, []));
      const nivel = Sueno.nivelDeLaNoche(n, conLoDeLaNoche);
      const precision = el('div', 'sn-precision');
      const puntos = el('span', 'sn-puntos');
      for (let i = 1; i <= 5; i++) puntos.appendChild(el('i', i <= nivel ? 'lleno' : null));
      precision.append(el('span', null, tx('sueno.precision.titulo')), puntos, el('b', null, tx('sueno.precision.niveles')[nivel]));
      c.appendChild(precision);
      const lista = el('ul', 'sn-fuentes-lista');
      const fila = (que, fuente, nivel) => {
        const li = el('li');
        const f = el('span', 'sn-fuente');
        if (fuente) f.innerHTML = icono(fuente.tipo === 'telefono' ? 'telefono' : 'reloj3');
        f.append(fuente ? fuente.nombre : '—');
        li.append(el('span', null, tx('sueno.datos.' + que)), f, nivel ? confianza(nivel) : el('em'));
        lista.appendChild(li);
      };
      if (n && n.moss) {
        // Sin reloj: la hora sale de Moss o de lo que contestaste; lo demás no lo sabe el teléfono.
        const quien = n.moss.origen === 'estimada' ? 'sueno.porMoss' : n.moss.origen === 'corregida' ? 'sueno.corregidaPorTi' : 'sueno.porTi';
        fila('duracion', { nombre: tx(quien), tipo: 'telefono' }, n.moss.origen === 'estimada' && n.moss.confianza !== 'alta' ? 'baja' : 'media');
        ['etapas', 'despertares', 'corazon', 'variabilidad'].forEach((k) => fila(k, null, null));
        c.appendChild(lista);
        c.appendChild(el('p', 'sn-nota', tx('sueno.fuentesSinReloj')));
        return c;
      }
      const reloj = Datos.FUENTES[0], iphone = Datos.FUENTES[1];
      const cama = soloEnCama(s.clave);
      fila('duracion', n ? n.fuente : null, n ? n.confianza.duracion : null);
      fila('etapas', n && n.conEtapas ? n.fuente : null, n ? n.confianza.etapas : null);
      fila('despertares', n ? n.fuente : null, n ? n.confianza.despertares : null);
      fila('enCama', n && n.enCama ? n.enCama.fuente : cama ? iphone : null, n && n.enCama ? n.confianza.enCama : cama ? 'baja' : null);
      fila('corazon', reloj, 'media');
      fila('variabilidad', reloj, 'baja');
      c.appendChild(lista);
      c.appendChild(el('p', 'sn-nota', tx('sueno.fuentesTexto')));
      return c;
    }

    // ------------------------------------------------------------ afinar (spec/sueno-sin-esfuerzo.md)
    // Sin reloj: el despertador de Moss (AlarmKit) y la guía de los Atajos que avisan a Moss, con lo que
    // llegó estos días. Con datos de mentira; en la app, src/secciones/sueno/Afinar.tsx.
    const GUARDADO_DESPERTADOR = 'moss-galeria-despertador';
    let despertador = { prendido: false, hora: 7, minuto: 0, dias: [1, 2, 3, 4, 5] };
    try { despertador = Object.assign(despertador, JSON.parse(localStorage.getItem(GUARDADO_DESPERTADOR) || '{}')); } catch (_) { /* no pasa nada */ }
    const guardarDespertador = () => { try { localStorage.setItem(GUARDADO_DESPERTADOR, JSON.stringify(despertador)); } catch (_) { /* no pasa nada */ } };
    const AUTOMATIZACIONES = [['alarma', 'alarmaParada'], ['conectar', 'cargadorConectado'], ['desconectar', 'cargadorDesconectado'], ['empieza', 'enfoqueEmpezo'], ['termina', 'enfoqueTermino']];
    // Lo que avisaron los Atajos estas noches: la alarma, el cargador y el enfoque Sueño con horario (23:15).
    function senales() {
      const en = (dias, h, m) => SinReloj.instanteDe(Fechas.sumarDias(Datos.HOY, dias), Datos.ZONA, (h < 18 ? h + 6 : h - 18) * 60 + m);
      return [
        ['enfoqueEmpezo', -2, 23, 15], ['alarmaParada', -1, 7, 1], ['enfoqueEmpezo', -1, 23, 15], ['cargadorConectado', -1, 23, 52],
        ['alarmaParada', 0, 7, 2], ['enfoqueEmpezo', 0, 23, 15], ['cargadorConectado', 0, 23, 41], ['cargadorDesconectado', 0, 7, 18],
      ].map(([que, dias, h, m], i) => ({ id: 'galeria-' + i, que, en: en(dias, h, m) })).sort((x, y) => x.en - y.en);
    }
    const zonaFija = () => Datos.ZONA;
    /** «hoy, 07:02», «ayer, 23:41» o «sáb, 23:15». */
    function cuando(ms) {
      const minutos = Math.floor(ms / 60000) + Datos.ZONA;
      const dia = Math.floor(minutos / 1440), hoy = Math.floor((SinReloj.instanteDe(Datos.HOY, Datos.ZONA, 360) / 60000 + Datos.ZONA) / 1440);
      const hora = u.horaMin(((minutos % 1440) + 1440) % 1440);
      if (dia === hoy) return tx('sueno.afinar.hoy', { hora });
      if (dia === hoy - 1) return tx('sueno.afinar.ayer', { hora });
      return tx('sueno.afinar.dia', { dia: tx('fecha.diasCortos.' + new Date(dia * 86400000).getUTCDay()), hora });
    }
    function resumenDespertador() {
      const d = [...despertador.dias].sort().join(',');
      const dias = !despertador.dias.length ? tx('sueno.afinar.despertador.unaVez')
        : despertador.dias.length === 7 ? tx('sueno.afinar.despertador.todos')
        : d === '1,2,3,4,5' ? tx('sueno.afinar.despertador.semana')
        : d === '0,6' ? tx('sueno.afinar.despertador.finDe')
        : [1, 2, 3, 4, 5, 6, 0].filter((x) => despertador.dias.includes(x)).map((x) => tx('fecha.diasCortos.' + x)).join(' ');
      return `${u.horaMin(despertador.hora * 60 + despertador.minuto)} · ${dias}`;
    }
    const llaveDelDespertador = () => {
      const llave = boton('in-llave', '<i></i>', () => {
        despertador.prendido = !despertador.prendido;
        guardarDespertador();
        pintar();
        if (hojaAfinar.abierta) pintarHoja();
      }, tx('sueno.afinar.despertador.titulo'));
      llave.setAttribute('aria-pressed', String(despertador.prendido));
      return llave;
    };
    // Lo que le llegó del cargador, según cómo esté en la galería (`cargador`, abajo): Moss no ve las
    // automatizaciones de Atajos, pero sí lo que le llega (SinReloj.estadoDelCargador).
    function estadoDelCargador() {
      const en = (dias, h, m) => SinReloj.instanteDe(Fechas.sumarDias(Datos.HOY, dias), Datos.ZONA, (h < 18 ? h + 6 : h - 18) * 60 + m);
      const lista = {
        sinArmar: [],
        anda: [['cargadorConectado', 0, 23, 41], ['cargadorDesconectado', 0, 7, 18]],
        dejoDeLlegar: [['cargadorConectado', -4, 23, 30], ['cargadorDesconectado', -4, 7, 10]],
        aMedias: [['cargadorConectado', -2, 23, 40], ['cargadorConectado', -1, 23, 52], ['cargadorConectado', 0, 23, 41]],
      }[s.cargador || 'sinArmar'].map(([que, dias, h, m], i) => ({ id: 'cargador-' + i, que, en: en(dias, h, m) }));
      return SinReloj.estadoDelCargador(lista, en(0, 9, 0));
    }
    function textoDelCargador(e) {
      if (e.estado === 'anda') return tx('sueno.afinar.cargador.anda', { cuando: cuando(e.ultima) });
      if (e.estado === 'dejoDeLlegar') return tx('sueno.afinar.cargador.dejoDeLlegar', { dias: e.dias });
      if (e.estado === 'aMedias') return tx(e.falta === 'conectar' ? 'sueno.afinar.cargador.faltaConectar' : 'sueno.afinar.cargador.faltaDesconectar');
      return tx('sueno.afinar.cargador.sinArmar');
    }
    /** Si dejó de llegar, lo avisa una vez arriba de «Afinar», con «Revisar». */
    function avisoDelCargador() {
      const e = estadoDelCargador();
      if (e.estado !== 'dejoDeLlegar') return null;
      const c = carta('sn-movimiento sn-aviso-cargador', null);
      const txt = el('div');
      txt.append(el('b', null, tx('sueno.afinar.cargador.avisoTitulo')), el('p', null, tx('sueno.afinar.cargador.avisoTexto')));
      c.append(txt, boton('sn-permitir', tx('sueno.afinar.cargador.avisoBoton'), () => opciones.abrirGuia && opciones.abrirGuia()));
      return c;
    }
    function afinar() {
      const c = carta('sn-afinar', tx('sueno.afinar.titulo'));
      c.appendChild(el('p', 'sn-nota', tx('sueno.afinar.texto')));
      const fila = el('div', 'sn-afinar-fila');
      const textos = boton('sn-afinar-textos', '', () => abrirHoja('despertador'));
      textos.append(el('b', null, tx('sueno.afinar.despertador.titulo')), el('span', null, despertador.prendido ? resumenDespertador() : tx('sueno.afinar.despertador.apagado')));
      fila.append(textos, llaveDelDespertador());
      const atajos = boton('sn-afinar-fila sn-afinar-atajos', '', () => abrirHoja('atajos'));
      const t2 = el('span', 'sn-afinar-textos');
      t2.append(el('b', null, tx('sueno.afinar.atajos.titulo')), el('span', null, tx('sueno.afinar.atajos.fila')));
      atajos.appendChild(t2);
      atajos.insertAdjacentHTML('beforeend', icono('adelante'));
      const est = estadoDelCargador();
      const cargador = boton('sn-afinar-fila sn-afinar-cargador', '', () => opciones.abrirGuia && opciones.abrirGuia());
      const t3 = el('span', 'sn-afinar-textos');
      t3.append(el('b', null, tx('sueno.afinar.cargador.titulo')), el('span', est.estado === 'anda' ? 'llego' : est.estado === 'sinArmar' ? null : 'falla', textoDelCargador(est)));
      cargador.appendChild(t3);
      cargador.insertAdjacentHTML('beforeend', icono('adelante'));
      c.append(fila, cargador, atajos);
      return c;
    }
    // Las dos hojas de «Afinar»: el despertador y los Atajos.
    const hojaAfinar = Util.hoja(tel, 'sn-hoja', () => { s.hoja = null; });
    function abrirHoja(cual, abierta) {
      s.hoja = cual;
      s.automatizacion = abierta || null;
      pintarHoja();
      hojaAfinar.abrir();
    }
    function pintarHoja() {
      const h = hojaAfinar.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx(s.hoja === 'despertador' ? 'sueno.afinar.despertador.titulo' : 'sueno.afinar.atajos.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaAfinar.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos sn-hoja-cuerpo');
      if (s.hoja === 'despertador') {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        fila.append(el('b', null, tx('sueno.afinar.despertador.titulo')), llaveDelDespertador());
        caja.appendChild(fila);
        cuerpo.appendChild(caja);
        const mover = (m) => {
          const total = (((despertador.hora * 60 + despertador.minuto + m) % 1440) + 1440) % 1440;
          despertador.hora = Math.floor(total / 60);
          despertador.minuto = total % 60;
          guardarDespertador();
          valor.textContent = u.horaMin(total);
          pintar();
        };
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('sueno.afinar.despertador.hora')));
        const pasos = el('div', 'sn-hora-pasos');
        const valor = el('b', null, u.horaMin(despertador.hora * 60 + despertador.minuto));
        pasos.append(boton('sn-paso', '−', () => mover(-60), '−1 h'), boton('sn-paso', '−5', () => mover(-5), '−5 min'), valor, boton('sn-paso', '+5', () => mover(5), '+5 min'), boton('sn-paso', '+', () => mover(60), '+1 h'));
        cuerpo.appendChild(pasos);
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('sueno.afinar.despertador.dias')));
        const dias = el('div', 'fi-porciones sn-dias');
        [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
          const b = boton('fi-porcion', `<span>${tx('fecha.diasCortos.' + d).charAt(0)}</span>`, () => {
            despertador.dias = despertador.dias.includes(d) ? despertador.dias.filter((x) => x !== d) : [...despertador.dias, d];
            guardarDespertador();
            pintarHoja();
            pintar();
          }, tx('fecha.dias.' + d));
          b.setAttribute('aria-pressed', String(despertador.dias.includes(d)));
          dias.appendChild(b);
        });
        cuerpo.appendChild(dias);
        if (!despertador.dias.length) cuerpo.appendChild(el('p', 'pf-nota', tx('sueno.afinar.despertador.sinDias')));
        ['texto', 'reloj', 'oculta'].forEach((k) => cuerpo.appendChild(el('p', 'pf-nota', tx('sueno.afinar.despertador.' + k))));
      } else {
        const lista = senales();
        const semana = lista.filter((x) => x.en >= SinReloj.instanteDe(Datos.HOY, Datos.ZONA, 360) - 7 * 86400000);
        cuerpo.appendChild(el('p', 'pf-nota sn-atajos-texto', tx('sueno.afinar.atajos.texto')));
        cuerpo.appendChild(boton('sn-permitir sn-abrir-atajos', tx('sueno.afinar.atajos.abrir'), () => {}));
        AUTOMATIZACIONES.forEach(([cual, que]) => {
          const caja = el('section', 'pf-aviso sn-automatizacion' + (s.automatizacion === cual ? ' abierta' : ''));
          const ultima = semana.filter((x) => x.que === que).pop();
          const cab2 = boton('sn-automatizacion-cab', '', () => { s.automatizacion = s.automatizacion === cual ? null : cual; pintarHoja(); });
          const textos = el('span', 'sn-afinar-textos');
          textos.append(el('b', null, tx(`sueno.afinar.atajos.cuales.${cual}.titulo`)), el('span', ultima ? 'llego' : null, ultima ? tx('sueno.afinar.atajos.llego', { cuando: cuando(ultima.en) }) : tx('sueno.afinar.atajos.noLlego')));
          cab2.appendChild(textos);
          cab2.insertAdjacentHTML('beforeend', icono(s.automatizacion === cual ? 'arriba' : 'abajo'));
          caja.appendChild(cab2);
          if (s.automatizacion === cual) {
            const pasos = el('ol', 'sn-pasos');
            tx('sueno.afinar.atajos.pasos').forEach((p) => pasos.appendChild(el('li', null, p.replace('{activador}', tx(`sueno.afinar.atajos.cuales.${cual}.activador`)).replace('{accion}', tx(`sueno.afinar.atajos.cuales.${cual}.accion`)))));
            caja.appendChild(pasos);
          }
          cuerpo.appendChild(caja);
        });
        cuerpo.appendChild(el('p', 'pf-nota', tx('sueno.afinar.atajos.siri')));
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('sueno.afinar.atajos.recientes')));
        const recientes = el('div', 'sn-datos sn-recientes');
        [...semana].reverse().forEach((x) => {
          const d = el('div', 'sn-dato');
          const que = el('span', null, tx('sueno.afinar.atajos.senales.' + x.que));
          if (SinReloj.esProgramado(x, lista, zonaFija)) que.appendChild(el('small', null, ' · ' + tx('sueno.afinar.atajos.horario')));
          d.append(que, el('b', null, cuando(x.en)));
          recientes.appendChild(d);
        });
        cuerpo.appendChild(recientes);
      }
      h.append(cab, cuerpo);
    }

    pintar();
    return {
      zona,
      pintar,
      // Para las capturas: «Afinar» (`despertador`, `atajos` o `cerrar`; `prender` lo enciende) y bajar en la hoja.
      afinar(accion, arg) {
        if (accion === 'cerrar') hojaAfinar.cerrar();
        else if (accion === 'prender') { despertador.prendido = arg !== false; guardarDespertador(); pintar(); if (hojaAfinar.abierta) pintarHoja(); }
        else if (accion === 'bajarHoja') { const c = hojaAfinar.el.querySelector('.sn-hoja-cuerpo'); if (c) c.scrollTop = c.scrollHeight; }
        else abrirHoja(accion, arg);
      },
      // Las noches de la sección (de Salud y, sin reloj, las de Moss): las usa Ascent.
      noches: todasLasNoches,
      // Lo que contestó a la mañana de una noche (1 a 5), o null: lo usa la recuperación.
      cara: (clave) => caras[clave] || null,
      // Lo de anoche para el bloque de Inicio.
      anoche() {
        const n = todasLasNoches().find((x) => x.clave === Datos.HOY);
        if (!n) return null;
        const q = Sueno.calidadDeNoche(n, necesidadDeFabrica, Sueno.ultimasNoches(todasLasNoches(), Fechas.sumarDias(n.clave, -1), DIAS));
        return { fuente: n.fuente, dormido: n.dormido, dormirse: n.dormirse + 18 * 60, despertar: n.despertar + 18 * 60, calidad: q ? q.puntos : null, enCamaDesde: n.dormirse, enCamaHasta: n.despertar, tramos: n.tramos };
      },
      // Para mirar la propuesta: `datos`, `dos`, `una`, `vacio`, `pagada` o `mucha`.
      ponerEstado,
      get estado() { return s.estado; },
      // Para las capturas y los botones de la galería: `k` días antes de hoy, o una clave.
      verNoche(k) { s.clave = typeof k === 'number' ? Fechas.sumarDias(Datos.HOY, k) : k; s.editando = null; pintar(); cont.scrollTop = 0; },
      // Para las capturas: la pregunta de la hora (`proponer`, `sinProponer`, `soloDormirse` o null), sin lo contestado antes.
      preguntarHora(modo) {
        s.soloDormirse = modo === 'soloDormirse';
        s.forzarHora = s.soloDormirse ? 'proponer' : modo;
        s.editandoHora = false;
        delete horas[Datos.HOY];
        ahoraNo.delete(Datos.HOY);
        pintar();
      },
      editarHora() { s.editandoHora = true; pintar(); },
      // Para los botones de la galería: abrir el porqué y cómo está el cargador.
      porque(si) { s.porque = si !== false; pintar(); },
      cargador(estado) { s.cargador = estado; pintar(); },
      editarNoche(k) { s.clave = typeof k === 'number' ? Fechas.sumarDias(Datos.HOY, k) : k; s.editando = s.clave; pintar(); },
      olvidarHoras() {
        horas = {};
        conMovimiento = false;
        try { localStorage.removeItem(GUARDADO_HORAS); localStorage.removeItem(GUARDADO_MOVIMIENTO); } catch (_) { /* no pasa nada */ }
        pintar();
      },
      abrir(cual) { s.abierto = cual; pintar(); },
      // Para las capturas: la sugerencia de poco sueño por semanas.
      poco(si) { s.poco = si; pintar(); cont.scrollTop = 0; },
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTo({ top: Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 70), behavior: 'auto' });
      },
      subir() { cont.scrollTo(0, 0); },
    };
  }

  return { crear };
})();
