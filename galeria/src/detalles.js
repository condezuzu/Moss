// Los detalles de una app profesional (6/11/2026, para aprobar): lo chico que se nota cuando falta. Lo que
// comparten las secciones:
// - el teclado del iPhone dibujado, con la barra de «Listo» y «Siguiente» arriba del de números (iOS no le
//   pone tecla de retorno; React Native le agrega una barra nativa con un botón);
// - mantener apretado: lo que se toca se levanta apenas y sale un menú corto, que crece desde ahí;
// - deslizar a la izquierda para borrar, con un tope que se siente;
// - la franja bajo la hora, que separa lo que pasa por debajo al hacer scroll;
// - la ruedita de espera de iOS, el velo con lo que está pasando y la alerta del sistema;
// - deslizar para abajo para volver a leer (Sueño).
// Los textos nuevos van acá con las claves que tendrían en src/textos (la galería no toca src/ mientras se
// aprueba): se suman al diccionario solo donde falta la clave, así lo que ya esté en la app manda.

const Detalles = (() => {
  const TEXTOS_NUEVOS = {
    es: {
      comun: { siguiente: 'Siguiente' },
      comida: {
        menu: {
          copiarA: 'Copiar a…', moverA: 'Mover a…', borrar: 'Borrar', copiarTitulo: 'Copiar a', moverTitulo: 'Mover a',
          copiado: 'Copiado {donde}', movido: 'Movido {donde}',
          comidaBorrada: { uno: '{comida} · {n} alimento quitado', otros: '{comida} · {n} alimentos quitados' },
          donde: { mismo: '{aLa}', hoy: '{aLa} de hoy', ayer: '{aLa} de ayer', manana: '{aLa} de mañana', otro: '{aLa} del {dia}' },
          aca: 'Está aquí',
        },
        delDia: { ayer: 'ayer', manana: 'mañana', otro: '{dia} {num}' },
        agregarADia: { ayer: 'Agregar {aLa} de ayer', manana: 'Agregar {aLa} de mañana', otro: 'Agregar {aLa} del {dia}' },
        guardadasEditar: {
          tusAlimentos: 'Tus alimentos', loQueLleva: 'Lo que lleva', tocaParaCambiar: 'Toca una para cambiarla o borrarla.',
          borrarComida: 'Borrar esta comida', borrarReceta: 'Borrar esta receta', borrarAlimento: 'Borrar este alimento',
          borrada: 'Borraste «{nombre}»', vacia: 'Sin alimentos: agrega alguno o bórrala.',
        },
      },
      mas: { vasoQuitado: 'Un vaso de agua menos', mantenerParaQuitar: 'Mantén apretado para quitar el último vaso' },
      entrada: { cuenta: { entrando: 'Entrando…' } },
      perfil: { borrando: 'Borrando…', cerrandoSesion: 'Cerrando sesión…', exportando: 'Exportando…', alertaBorrar: 'Borrar' },
      sueno: { leer: { leyendo: 'Leyendo Salud…', listo: 'Al día con Salud' } },
    },
    en: {
      comun: { siguiente: 'Next' },
      comida: {
        menu: {
          copiarA: 'Copy to…', moverA: 'Move to…', borrar: 'Delete', copiarTitulo: 'Copy to', moverTitulo: 'Move to',
          copiado: 'Copied {donde}', movido: 'Moved {donde}',
          comidaBorrada: { uno: '{comida} · {n} food removed', otros: '{comida} · {n} foods removed' },
          donde: { mismo: '{aLa}', hoy: 'to today’s {comida}', ayer: 'to yesterday’s {comida}', manana: 'to tomorrow’s {comida}', otro: 'to {comida} on {dia}' },
          aca: 'It’s here',
        },
        delDia: { ayer: 'yesterday', manana: 'tomorrow', otro: '{dia} {num}' },
        agregarADia: { ayer: 'Log yesterday’s {comida}', manana: 'Log tomorrow’s {comida}', otro: 'Log {comida} for {dia}' },
        guardadasEditar: {
          tusAlimentos: 'Your foods', loQueLleva: 'What’s in it', tocaParaCambiar: 'Tap one to change or delete it.',
          borrarComida: 'Delete this meal', borrarReceta: 'Delete this recipe', borrarAlimento: 'Delete this food',
          borrada: 'Deleted “{nombre}”', vacia: 'Nothing in it: add something or delete it.',
        },
      },
      mas: { vasoQuitado: 'One less glass of water', mantenerParaQuitar: 'Touch and hold to remove the last glass' },
      entrada: { cuenta: { entrando: 'Signing in…' } },
      perfil: { borrando: 'Deleting…', cerrandoSesion: 'Signing out…', exportando: 'Exporting…', alertaBorrar: 'Delete' },
      sueno: { leer: { leyendo: 'Reading Health…', listo: 'Up to date with Health' } },
    },
  };
  function completar(destino, origen) {
    Object.entries(origen).forEach(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (!destino[k] || typeof destino[k] !== 'object') destino[k] = {};
        completar(destino[k], v);
      } else if (destino[k] == null) destino[k] = v;
    });
  }
  if (typeof TEXTOS !== 'undefined' && TEXTOS) ['es', 'en'].forEach((i) => { if (TEXTOS[i]) completar(TEXTOS[i], TEXTOS_NUEVOS[i]); });

  const CSS = `
/* La ruedita de iOS: ocho rayos que se apagan en ronda. */
.dt-ruedita { position: relative; display: inline-block; flex: none; width: 20px; height: 20px; color: rgba(239, 230, 207, 0.85); }
.dt-ruedita i { position: absolute; left: 50%; top: 0; width: 2.3px; height: 28%; margin-left: -1.15px; border-radius: 2px; background: currentColor; transform-origin: 50% 178%; transform: rotate(calc(var(--i) * 45deg)); opacity: 0.25; animation: dt-rayo 0.8s linear infinite; animation-delay: calc(var(--i) * 0.1s - 0.8s); }
@keyframes dt-rayo { from { opacity: 1; } to { opacity: 0.22; } }
.dt-ruedita.oscura { color: rgba(0, 0, 0, 0.72); }
.dt-ruedita.grande { width: 30px; height: 30px; }
/* Al tirar para abajo, los rayos aparecen de a uno y recién giran al soltar. */
.dt-ruedita.parcial i { animation: none; opacity: 0; transition: opacity 0.12s; }
.dt-ruedita.parcial i.ve { opacity: 0.5; }

/* La franja bajo la hora: del color del fondo a transparente; con todo arriba, no se ve. */
.dt-franja { position: absolute; left: 0; right: 0; top: 0; height: calc(var(--arriba) + 14px); z-index: 1; pointer-events: none; opacity: 0;
  background: linear-gradient(180deg, rgba(var(--dt-fondo, 3, 5, 12), 0.94) 0%, rgba(var(--dt-fondo, 3, 5, 12), 0.82) calc(100% - 26px), rgba(var(--dt-fondo, 3, 5, 12), 0) 100%); }

/* El teclado del iPhone, de noche, que sube desde abajo. Arriba del de números, la barra nativa. */
.tel .dt-teclado { position: absolute; left: 0; right: 0; bottom: 0; z-index: 12; background: #1d1e23; padding-bottom: calc(var(--abajo) + 4px); transform: translateY(105%); visibility: hidden;
  transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0s linear 0.32s; box-shadow: 0 -1px 0 rgba(0, 0, 0, 0.5); }
.tel .dt-teclado.visible { transform: none; visibility: visible; transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }
.dt-tk-barra { height: 44px; display: flex; align-items: center; justify-content: flex-end; padding: 0 6px; background: #2a2b31; border-bottom: 1px solid rgba(0, 0, 0, 0.45); }
.dt-tk-boton { appearance: none; cursor: pointer; border: 0; background: none; padding: 10px 12px; color: #0a84ff; font: 600 17px/1 -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; }
.dt-tk-boton.cambia { animation: dt-cambia 0.22s ease both; }
@keyframes dt-cambia { from { opacity: 0; transform: translateY(4px); } }
.dt-tk-boton:active { opacity: 0.5; }
.dt-teclado[data-modo='letras'] .dt-tk-barra, .dt-teclado[data-modo='letras'] .dt-tk-num, .dt-teclado[data-modo='numeros'] .dt-tk-letras { display: none; }
.dt-tk-num { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 6px 6px 4px; }
.dt-tk { height: 46px; border-radius: 6px; background: #5b5b60; color: #fff; display: grid; place-items: center; align-content: center; gap: 1px; box-shadow: 0 1px 0 rgba(0, 0, 0, 0.55); font: 400 25px/1 -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; cursor: pointer; user-select: none; -webkit-user-select: none; transition: background 0.08s; }
.dt-tk small { font: 600 9.5px/1 -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; letter-spacing: 0.16em; margin-right: -0.16em; }
.dt-tk.apretada { background: #7c7c82; }
.dt-tk.sin-fondo { background: transparent; box-shadow: none; }
.dt-tk.sin-fondo.apretada { background: #4a4a4f; }
.dt-tk svg { width: 24px; height: 24px; stroke: #fff; fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.dt-tk-letras { display: grid; align-content: start; gap: 11px; padding: 8px 3px 0; }
.dt-tk-letras .tk.apretada { background: #78787e; }
.dt-tk-letras .dt-tk-retorno { flex: 2.2 1 0; max-width: 92px; font-size: 15px; }
.dt-tk-letras .dt-tk-retorno.azul { background: #0a84ff; }

/* Lo que hace lugar al teclado: la hoja de abajo crece, la de registro se achica y la ventana sube. */
.tel .hb { transition: padding-bottom 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }
.tel .hb.dt-con-teclado { padding-bottom: calc(var(--dt-teclado, 290px) + 6px); }
/* Este estilo va antes que el de la página: con «.tel» adelante, gana a «.tel .hoja { --teclado: 0px }». */
.tel .hoja.dt-con-teclado, .tel .hoja.tactil.dt-con-teclado { --teclado: var(--dt-teclado, 290px); }
.hoja.dt-con-teclado .hj-teclado > * { visibility: hidden; }
.hoja.dt-con-teclado .hj-teclado { background: #1d1e23; }
.hoja.dt-con-teclado .fi-pie { padding-bottom: 10px; }
.hoja .hj-ventana { transition: transform 0.34s cubic-bezier(0.2, 0.8, 0.2, 1), bottom 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), max-height 0.32s cubic-bezier(0.2, 0.8, 0.2, 1); }
.hoja.dt-con-teclado .hj-ventana { bottom: var(--teclado); max-height: calc(100% - var(--teclado) - 18px); padding-bottom: 14px; }
/* Más baja (con el teclado, o con más vitaminas a la vista), la ventana se desliza: lo de adentro no se aplasta. */
.hoja .hj-ventana > * { flex-shrink: 0; }
/* La cantidad de la ventana se escribe, como en la app. */
input.fi-valor { width: 66px; min-width: 0; height: 34px; padding: 0 4px; border: 0; border-radius: 9px; background: transparent; color: var(--tinta); outline: none; caret-color: var(--oro); transition: background 0.2s; }
input.fi-valor:focus { background: rgba(239, 230, 207, 0.08); }
.fi-unidad { margin: 0 4px 0 -6px; font: 400 13px/1 var(--texto); color: rgba(239, 230, 207, 0.55); }

/* Perfil: lo que se prende y apaga ahí mismo, sin la flecha de entrar; la llave o el valor, a la derecha. */
.pf-fila.dt-sin-flecha { grid-template-columns: 30px minmax(min-content, 1fr) minmax(0, auto); }
.pf-fila .in-llave { display: block; justify-self: end; }
.dt-ruedita.chica { width: 17px; height: 17px; }
.dt-ruedita.chica i { width: 1.7px; margin-left: -0.85px; height: 29%; transform-origin: 50% 172%; }
.pf-fila-valor .dt-ruedita { color: rgba(239, 230, 207, 0.66); }

/* Sueño: «Cancelar» al lado de «Guardar» en el editor de la hora. */
.sn-editor-acciones { margin-top: 6px; }
.sn-editor-acciones .sn-guardar { margin-top: 0; }

/* El agua: el vaso que se quita se vacía, y lo que hay cambia para abajo o para arriba. */
.in-vasos i.sale { animation: dt-vaso-vacia 0.34s ease-out both; }
@keyframes dt-vaso-vacia { from { background: #bcd8f2; border-color: #bcd8f2; box-shadow: 0 0 6px rgba(188, 216, 242, 0.5); } }
.dt-sube { animation: dt-sube 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.dt-baja { animation: dt-baja 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes dt-sube { from { opacity: 0; transform: translateY(5px); } }
@keyframes dt-baja { from { opacity: 0; transform: translateY(-5px); } }

/* La hoja abierta para otro día lo dice arriba, chico. */
.hj-dia { position: absolute; left: 18px; top: 11px; font: 500 10px/1 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: var(--oro-claro); animation: dt-aparece-suave 0.3s ease both; }
.hj-dia[hidden] { display: none; }
@keyframes dt-aparece-suave { from { opacity: 0; } }
/* Los avisos con «Deshacer», opacos como en la app (#090e1e, desde f4e7500): lo de atrás no se trasluce. */
.tel .cm-aviso, .tel .hj-aviso, .tel .mas-aviso { background: #090e1e; -webkit-backdrop-filter: none; backdrop-filter: none; }
.cm-aviso.dt-aviso { z-index: 4; }
/* El aviso con «Deshacer» de un panel, arriba de sus botones y no encima (gana a la regla de la hoja sin bandeja). */
.tel .hoja.en-sub .hj-paneles ~ .hj-aviso { bottom: calc(var(--abajo) + 92px); }
/* Guardadas: lo de adentro de la hoja se desliza al cambiar, y «Borrar» va en rojo suave. */
.hj-sub.dt-sub-adelante > * { animation: dt-entra 0.26s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.hj-sub.dt-sub-atras > * { animation: dt-entra-izq 0.26s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.fi-quitar.dt-borrar { color: #f0a58a; border-color: rgba(240, 165, 138, 0.28); }
.dt-editar .fi-etq { margin-top: 18px; }
.dt-editar .cr-campo.dt-unidad-larga { grid-template-columns: minmax(0, 1fr) 92px auto; }
.dt-lleva .hj-fila { min-height: 50px; }
.dt-editar .rv-total { margin-top: 12px; }

/* Mantener apretado: mientras se aprieta se hunde un poco; al llegar, la copia se levanta sobre un velo. */
.dt-apretando { transform: scale(0.982); transition: transform 0.35s ease; }
.dt-origen-levantado { visibility: hidden; }
.tel .dt-menu-capa { position: absolute; inset: 0; z-index: 4; -webkit-touch-callout: none; }
.dt-menu-capa[hidden] { display: none; }
.dt-menu-velo { position: absolute; inset: 0; background: rgba(2, 4, 10, 0.56); -webkit-backdrop-filter: blur(5px); backdrop-filter: blur(5px); opacity: 0; transition: opacity 0.24s ease; }
.dt-menu-capa.abierto .dt-menu-velo { opacity: 1; }
.dt-menu-vista { position: absolute; margin: 0; pointer-events: none; border-radius: 12px; background: rgba(13, 19, 40, 0.98); box-shadow: 0 0 0 1px rgba(239, 230, 207, 0.06);
  transform: translate3d(0, 0, 0) scale(1); transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s ease; color: var(--tinta); }
.dt-menu-capa.abierto .dt-menu-vista { transform: translate3d(0, var(--dt-corre, 0px), 0) scale(1.03); box-shadow: 0 0 0 1px rgba(239, 230, 207, 0.12), 0 18px 46px rgba(0, 0, 0, 0.55); }
.dt-menu-vista > .cm-item { margin: 0; background: none; animation: none; }
.dt-menu-vista > .cm-tarjeta { margin: 0; animation: none; background: rgba(9, 14, 30, 0.98); }
.dt-menu-vista svg { stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.dt-menu { position: absolute; width: 236px; border-radius: 14px; overflow: hidden; background: rgba(18, 25, 50, 0.97); border: 1px solid rgba(239, 230, 207, 0.1); box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55);
  opacity: 0; transform: scale(0.7); transition: opacity 0.2s ease, transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), height 0.26s cubic-bezier(0.2, 0.8, 0.2, 1), top 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.dt-menu-capa.abierto .dt-menu { opacity: 1; transform: none; }
.dt-menu-dentro { animation: dt-entra 0.24s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.dt-menu-dentro.desde-izq { animation-name: dt-entra-izq; }
@keyframes dt-entra { from { opacity: 0; transform: translateX(14px); } }
@keyframes dt-entra-izq { from { opacity: 0; transform: translateX(-14px); } }
.dt-menu-fila { appearance: none; cursor: pointer; width: 100%; min-height: 46px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 14px 0 16px; border: 0; background: none; color: var(--tinta); font: 400 15px/1.2 var(--texto); text-align: left; transition: background 0.15s; }
.dt-menu-fila + .dt-menu-fila { border-top: 1px solid rgba(239, 230, 207, 0.07); }
.dt-menu-fila.separada { border-top: 7px solid rgba(2, 4, 10, 0.42) !important; }
.dt-menu-fila svg { flex: none; width: 18px; height: 18px; color: rgba(239, 230, 207, 0.66); stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.dt-menu-fila.peligro, .dt-menu-fila.peligro svg { color: #f0a58a; }
.dt-menu-fila:active { background: rgba(239, 230, 207, 0.07); }
@media (hover: hover) { .dt-menu-fila:hover { background: rgba(239, 230, 207, 0.05); } }
.dt-menu-fila:disabled { cursor: default; color: rgba(239, 230, 207, 0.4); }
.dt-menu-fila small { font: 400 11.5px/1 var(--texto); color: rgba(239, 230, 207, 0.42); }
.dt-menu-cab { display: grid; grid-template-columns: 34px minmax(0, 1fr) 34px; align-items: center; min-height: 44px; padding: 0 6px; border-bottom: 1px solid rgba(239, 230, 207, 0.08); }
.dt-menu-cab b { text-align: center; font: 500 14px/1 var(--texto); }
.dt-menu-volver { appearance: none; cursor: pointer; width: 34px; height: 34px; border: 0; border-radius: 50%; background: none; color: var(--oro-claro); display: grid; place-items: center; }
.dt-menu-volver svg { width: 18px; height: 18px; stroke: currentColor; fill: none; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.dt-menu-dias { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid rgba(239, 230, 207, 0.07); }
.dt-menu-dia { appearance: none; cursor: pointer; flex: 1 1 0; min-width: 0; height: 30px; padding: 0 6px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.14); background: transparent; color: rgba(239, 230, 207, 0.72); font: 400 12.5px/1 var(--texto); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background 0.2s, border-color 0.2s, color 0.2s; }
.dt-menu-dia[aria-pressed='true'] { background: rgba(232, 196, 106, 0.16); border-color: rgba(232, 196, 106, 0.62); color: var(--oro-claro); }
.dt-menu-sub .dt-menu-fila { min-height: 42px; }

/* Deslizar a la izquierda: lo de atrás se destapa desde el borde; pasado el tope, se llena. */
.cm-item.dt-desliza { display: block; position: relative; overflow: hidden; padding: 0; touch-action: pan-y; -webkit-touch-callout: none; }
.dt-desliza > .dt-frente { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: baseline; padding: 4px 6px; will-change: transform; }
.cm-item.dt-desliza.dt-corrida { background: none; }
.dt-accion { position: absolute; right: 0; top: 0; bottom: 0; width: 0; z-index: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 0; border: 0; border-radius: 8px; background: #a9503f; color: #fff1ea; font: 500 13px/1 var(--texto); white-space: nowrap; cursor: pointer; transition: background 0.18s; }
.dt-accion span { padding: 0 14px; transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1); }
.dt-accion.lleno { background: #c05a46; justify-content: flex-start; }
.dt-colapsa { overflow: hidden; transition: height 0.26s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, margin 0.26s ease, padding 0.26s ease; }
.dt-colapsa.cerrado { height: 0 !important; opacity: 0; margin-top: 0 !important; margin-bottom: 0 !important; padding-top: 0 !important; padding-bottom: 0 !important; }
.dt-crece { animation: dt-crece 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
@keyframes dt-crece { from { opacity: 0; transform: translateY(-4px); } }

/* El velo con lo que está pasando, y la alerta del sistema (de noche, como la de iOS). */
.tel .dt-velo { position: absolute; inset: 0; z-index: 40; display: grid; place-items: center; align-content: center; gap: 14px; background: rgba(3, 5, 12, 0.66); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; transition: opacity 0.28s ease; pointer-events: auto; }
.dt-velo[hidden] { display: none; }
.dt-velo.visible { opacity: 1; }
.dt-velo p { margin: 0; font: 400 14.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.86); transition: opacity 0.2s; }
.dt-velo .dt-listo { width: 30px; height: 30px; stroke: var(--salvia); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; animation: dt-aparece 0.3s ease both; }
@keyframes dt-aparece { from { opacity: 0; transform: scale(0.8); } }
.tel .dt-alerta-capa { position: absolute; inset: 0; z-index: 41; display: grid; place-items: center; background: rgba(0, 0, 0, 0.42); opacity: 0; transition: opacity 0.22s ease; }
.dt-alerta-capa[hidden] { display: none; }
.dt-alerta-capa.visible { opacity: 1; }
.dt-alerta { width: 270px; border-radius: 14px; overflow: hidden; background: rgba(40, 40, 44, 0.94); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); text-align: center; color: #fff; transform: scale(1.12); transition: transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1); font-family: -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; }
.dt-alerta-capa.visible .dt-alerta { transform: none; }
.dt-alerta h4 { margin: 19px 16px 0; font: 600 17px/1.25 inherit; }
.dt-alerta p { margin: 4px 16px 18px; font: 400 13px/1.35 inherit; color: rgba(255, 255, 255, 0.86); }
.dt-alerta-botones { display: grid; grid-template-columns: 1fr 1fr; border-top: 0.5px solid rgba(255, 255, 255, 0.18); }
.dt-alerta-botones button { appearance: none; cursor: pointer; height: 44px; border: 0; background: none; color: #0a84ff; font: 400 17px/1 inherit; }
.dt-alerta-botones button + button { border-left: 0.5px solid rgba(255, 255, 255, 0.18); }
.dt-alerta-botones button.cancelar { font-weight: 600; }
.dt-alerta-botones button.peligro { color: #ff453a; }
.dt-alerta-botones button:active { background: rgba(255, 255, 255, 0.08); }

/* Deslizar para abajo para volver a leer: la ruedita arriba, en el lugar que deja lo que baja. «Al día con
   Salud» ocupa el mismo lugar que la ruedita (se cruzan), así no se monta sobre la fecha. */
.dt-tirar { position: absolute; left: 50%; top: calc(var(--arriba) + 6px); z-index: 1; display: grid; justify-items: center; align-items: center; pointer-events: none; opacity: 0; transform: translate3d(-50%, 0, 0); }
.dt-tirar > * { grid-area: 1 / 1; }
.dt-tirar-txt { font: 400 11.5px/1 var(--texto); color: rgba(239, 230, 207, 0.55); white-space: nowrap; opacity: 0; transition: opacity 0.25s; }
.dt-tirar.listo .dt-tirar-txt { opacity: 1; }
.dt-tirar.listo .dt-ruedita { opacity: 0; transition: opacity 0.2s; }

@media (prefers-reduced-motion: reduce) {
  /* Sin movimiento, el teclado aparece con un fundido corto en vez de subir. */
  .tel .dt-teclado { transform: none; opacity: 0; transition: opacity 0.2s ease, visibility 0s linear 0.2s; }
  .tel .dt-teclado.visible { opacity: 1; transition: opacity 0.2s ease; }
  .dt-menu, .dt-menu-vista, .tel .hb, .dt-colapsa, .dt-alerta { transition-property: opacity, visibility; }
  .dt-menu, .dt-menu-capa.abierto .dt-menu, .dt-menu-capa.abierto .dt-menu-vista, .dt-alerta { transform: none; }
  .dt-menu-dentro, .dt-crece, .dt-tk-boton.cambia, .hj-sub.dt-sub-adelante > *, .hj-sub.dt-sub-atras > *, .hj-dia, .in-vasos i.sale, .dt-sube, .dt-baja { animation: none; }
  .dt-apretando { transform: none; }
}
`;
  const estilo = document.createElement('style');
  estilo.textContent = CSS;
  document.head.appendChild(estilo);

  const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esTactil = () => window.matchMedia('(pointer: coarse)').matches;
  const el = (etiqueta, clase, texto) => {
    const n = document.createElement(etiqueta);
    if (clase) n.className = clase;
    if (texto != null) n.textContent = texto;
    return n;
  };
  // Para no dejar que una sección se mueva atrás de un menú, una alerta o un velo.
  let ocupados = 0;
  const ocupar = (si) => { ocupados = Math.max(0, ocupados + (si ? 1 : -1)); };

  // ------------------------------------------------------------ la ruedita
  function ruedita(clase) {
    const r = el('span', 'dt-ruedita' + (clase ? ' ' + clase : ''));
    r.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 8; i++) { const p = el('i'); p.style.setProperty('--i', i); r.appendChild(p); }
    return r;
  }

  // ------------------------------------------------------------ cerrar una fila sin que salte
  /** Achica un nodo hasta cero (alto, márgenes y opacidad) y después llama a `despues`. */
  function colapsar(nodo, despues, ms = 270) {
    if (!nodo || quieto()) { if (despues) despues(); return; }
    nodo.style.height = `${nodo.offsetHeight}px`;
    nodo.classList.add('dt-colapsa');
    void nodo.offsetHeight;
    nodo.classList.add('cerrado');
    setTimeout(() => { if (despues) despues(); }, ms);
  }

  // ------------------------------------------------------------ un aviso con «Deshacer», donde no había
  /** El mismo de Comida (arriba, con «Deshacer»), para una sección que no tenía. */
  function aviso(contenedor, tx) {
    const a = el('div', 'cm-aviso dt-aviso');
    a.setAttribute('role', 'status');
    a.appendChild(el('span'));
    contenedor.appendChild(a);
    let espera = 0;
    a.addEventListener('click', (ev) => { if (!ev.target.closest('button')) a.classList.remove('visible'); });
    return (texto, deshacer) => {
      a.querySelector('span').textContent = texto;
      a.querySelector('button')?.remove();
      if (deshacer) {
        const b = el('button', 'cm-aviso-btn', tx('comun.deshacer'));
        b.type = 'button';
        b.addEventListener('click', (ev) => { ev.stopPropagation(); a.classList.remove('visible'); deshacer(); });
        a.appendChild(b);
      }
      a.classList.add('visible');
      clearTimeout(espera);
      espera = setTimeout(() => a.classList.remove('visible'), deshacer ? 3200 : 2200);
    };
  }

  // ------------------------------------------------------------ la franja bajo la hora
  /** Un degradado fijo arriba que aparece con el scroll; con todo arriba no se ve. `rgb`: el color del fondo. */
  function franja(zona, scroll, rgb) {
    if (!zona || !scroll) return;
    const f = el('div', 'dt-franja');
    f.setAttribute('aria-hidden', 'true');
    if (rgb) f.style.setProperty('--dt-fondo', rgb);
    zona.appendChild(f);
    let pedido = 0;
    const poner = () => { pedido = 0; f.style.opacity = Math.min(1, Math.max(0, scroll.scrollTop / 24)).toFixed(3); };
    scroll.addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(poner); }, { passive: true });
    poner();
  }

  // ------------------------------------------------------------ el teclado
  const NUMEROS = [['1', ''], ['2', 'ABC'], ['3', 'DEF'], ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'], ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ']];
  const FILAS = { es: ['qwertyuiop', 'asdfghjklñ', '⇧zxcvbnm⌫'], en: ['qwertyuiop', 'asdfghjkl', '⇧zxcvbnm⌫'] };
  const BORRAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12z"/><path d="m11.5 9.5 5 5M16.5 9.5l-5 5"/></svg>';
  const MAYUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5 4.5 12H9v7h6v-7h4.5z"/></svg>';
  const GLOBO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16"/></svg>';
  const MICROFONO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3"/></svg>';

  /**
   * El teclado dibujado de un teléfono: uno solo, que sube para el campo que tenga el foco. `encadenar` une
   * los campos de una pantalla: en el de números, la barra dice «Siguiente» si hay otro después y «Listo» en
   * el último; en el de letras, lo dice la tecla de retorno. En un teléfono de verdad, los campos de letras
   * usan el teclado del sistema y los de números, este (para ver la barra).
   */
  function teclado(tel, { tx, idioma, haptico }) {
    const raiz = el('div', 'dt-teclado');
    raiz.setAttribute('aria-hidden', 'true');
    raiz.dataset.modo = 'numeros';
    raiz.innerHTML = '<div class="dt-tk-barra"><button type="button" class="dt-tk-boton"></button></div><div class="dt-tk-num"></div><div class="dt-tk-letras"></div>';
    tel.appendChild(raiz);
    // Tocar entre las teclas tampoco le saca el foco al campo.
    raiz.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); });
    const botonBarra = raiz.querySelector('.dt-tk-boton');
    let actual = null;
    let espera = 0;
    let contenedorActual = null;
    let idiomaArmado = null;
    let retorno = null;

    const tecla = (contenido, clase, alTocar) => {
      const k = el('span', clase);
      k.innerHTML = contenido;
      // Sin robar el foco del campo.
      k.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); k.classList.add('apretada'); alTocar(); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((t) => k.addEventListener(t, () => k.classList.remove('apretada')));
      return k;
    };
    function escribir(t) {
      const i = actual && actual.input;
      if (!i || !i.isConnected) { ocultar(); return; }
      const a = i.selectionStart ?? i.value.length, b = i.selectionEnd ?? a;
      i.setRangeText(t, a, b, 'end');
      i.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function borrar() {
      const i = actual && actual.input;
      if (!i || !i.isConnected) { ocultar(); return; }
      const a = i.selectionStart ?? i.value.length, b = i.selectionEnd ?? a;
      if (a === b && a === 0) return;
      i.setRangeText('', a === b ? a - 1 : a, b, 'end');
      i.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function armar() {
      const id = idioma();
      if (idiomaArmado === id) return;
      idiomaArmado = id;
      const num = raiz.querySelector('.dt-tk-num');
      num.innerHTML = '';
      NUMEROS.forEach(([n, l]) => num.appendChild(tecla(`${n}${l ? `<small>${l}</small>` : ''}`, 'dt-tk', () => escribir(n))));
      // El separador decimal es el de la región del teléfono: la coma en Uruguay.
      const coma = id === 'es' ? ',' : '.';
      num.append(tecla(coma, 'dt-tk sin-fondo', () => escribir(coma)), tecla('0', 'dt-tk', () => escribir('0')), tecla(BORRAR, 'dt-tk sin-fondo', borrar));
      const letras = raiz.querySelector('.dt-tk-letras');
      letras.innerHTML = '';
      FILAS[id].forEach((fila, i) => {
        const f = el('div', 'tk-fila tk-fila-' + i);
        [...fila].forEach((c) => {
          if (c === '⇧') f.appendChild(tecla(MAYUS, 'tk tk-especial tk-ancha', () => {}));
          else if (c === '⌫') f.appendChild(tecla(BORRAR, 'tk tk-especial tk-ancha', borrar));
          else f.appendChild(tecla(c, 'tk', () => escribir(c)));
        });
        letras.appendChild(f);
      });
      const ultima = el('div', 'tk-fila tk-fila-3');
      retorno = tecla('', 'tk tk-especial dt-tk-retorno', () => alRetorno());
      ultima.append(tecla('123', 'tk tk-especial tk-media', () => {}), tecla(id === 'es' ? 'espacio' : 'space', 'tk tk-espacio', () => escribir(' ')), retorno);
      const sistema = el('div', 'tk-sistema');
      sistema.append(tecla(GLOBO, 'tk tk-sis', () => {}), tecla(MICROFONO, 'tk tk-sis', () => {}));
      letras.append(ultima, sistema);
    }
    const hayOtro = (c) => c.i < c.cadena.length - 1;
    function alRetorno() { if (actual && hayOtro(actual)) siguiente(); else listo(); }
    function siguiente() {
      if (!actual) return;
      const otro = actual.cadena[actual.i + 1];
      if (haptico) haptico('suave');
      if (otro && otro.isConnected) otro.focus({ preventScroll: true }); else listo();
    }
    function listo() {
      const i = actual && actual.input;
      ocultar();
      if (i) i.blur();
    }
    botonBarra.addEventListener('pointerdown', (ev) => ev.preventDefault());
    botonBarra.addEventListener('click', (ev) => { ev.stopPropagation(); alRetorno(); });

    /** Cuánto falta correr el scroll para que el campo quede arriba del teclado (y su scroll), o null. */
    function faltaPara(input) {
      let p = input.parentElement;
      while (p && p !== tel) {
        const o = getComputedStyle(p).overflowY;
        if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 1) break;
        p = p.parentElement;
      }
      if (!p || p === tel) return null;
      const r = input.getBoundingClientRect(), rp = p.getBoundingClientRect();
      const tope = Math.min(rp.bottom, tel.getBoundingClientRect().bottom - raiz.offsetHeight) - 14;
      const arriba = rp.top + 10;
      return { p, d: r.bottom > tope ? r.bottom - tope : r.top < arriba ? r.top - arriba : 0 };
    }
    /**
     * El campo, a la vista mientras la hoja se acomoda al teclado: en cada cuadro el scroll se acerca un tramo a
     * donde tiene que ir, así acompaña lo que se mueve y nunca salta.
     */
    function aLaVista(c) {
      const t0 = performance.now();
      let quietos = 0;
      const cuadro = () => {
        if (actual !== c || !c.input.isConnected) return;
        const f = faltaPara(c.input);
        if (f && Math.abs(f.d) > 0.5) { f.p.scrollTop += quieto() ? f.d : f.d * 0.3; quietos = 0; } else quietos++;
        // Sigue hasta que la hoja terminó de acomodarse y el campo quedó quieto un rato (con un tope).
        const pasado = performance.now() - t0;
        if (pasado < 2600 && (pasado < 800 || quietos < 12)) requestAnimationFrame(cuadro);
      };
      requestAnimationFrame(cuadro);
    }

    function mostrar(c) {
      clearTimeout(espera);
      // En un teléfono, los de letras usan el teclado del sistema.
      if (!c.numerico && esTactil()) { ocultar(); return; }
      armar();
      const antes = actual;
      actual = c;
      raiz.dataset.modo = c.numerico ? 'numeros' : 'letras';
      const texto = tx(hayOtro(c) ? 'comun.siguiente' : 'comun.listo');
      if (botonBarra.textContent !== texto) {
        botonBarra.textContent = texto;
        if (antes) { botonBarra.classList.remove('cambia'); void botonBarra.offsetWidth; botonBarra.classList.add('cambia'); }
      }
      if (retorno) {
        retorno.textContent = hayOtro(c) ? (idioma() === 'es' ? 'siguiente' : 'next') : (idioma() === 'es' ? 'OK' : 'done');
        retorno.classList.toggle('azul', !hayOtro(c));
      }
      if (contenedorActual && contenedorActual !== c.contenedor) contenedorActual.classList.remove('dt-con-teclado');
      contenedorActual = c.contenedor || null;
      raiz.classList.add('visible');
      tel.style.setProperty('--dt-teclado', `${raiz.offsetHeight}px`);
      if (contenedorActual) contenedorActual.classList.add('dt-con-teclado');
      aLaVista(c);
    }
    function ocultar() {
      clearTimeout(espera);
      actual = null;
      raiz.classList.remove('visible');
      if (contenedorActual) contenedorActual.classList.remove('dt-con-teclado');
      contenedorActual = null;
    }

    return {
      /** Une los campos de una pantalla, en orden; `contenedor`, lo que se acomoda para hacerle lugar. */
      encadenar(inputs, { contenedor } = {}) {
        const cadena = inputs.filter(Boolean);
        cadena.forEach((input, i) => {
          const numerico = /decimal|numeric/.test(input.inputMode || input.getAttribute('inputmode') || '');
          // En un teléfono de verdad, el de números es este, para ver su barra.
          if (numerico && esTactil()) input.inputMode = 'none';
          input.setAttribute('enterkeyhint', i < cadena.length - 1 ? 'next' : 'done');
          const datos = () => ({ input, cadena, i, numerico, contenedor: contenedor || input.closest('.hb, .hoja') });
          input.addEventListener('focus', () => mostrar(datos()));
          input.addEventListener('blur', () => {
            clearTimeout(espera);
            espera = setTimeout(() => { if (actual && actual.input === input && document.activeElement !== input) ocultar(); }, 90);
          });
          input.addEventListener('keydown', (ev) => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            if (!actual || actual.input !== input) mostrar(datos());
            alRetorno();
          });
        });
        return cadena;
      },
      ocultar,
      get visible() { return !!actual; },
      // Para las capturas: el botón de la barra, como si se tocara.
      tocarBarra() { if (actual) alRetorno(); },
      get texto() { return actual ? (actual.numerico ? botonBarra.textContent : retorno && retorno.textContent) : null; },
    };
  }

  // ------------------------------------------------------------ mantener apretado
  /**
   * A los `ms` de apretar sin moverse llama a `alMantener`; el toque que llega al soltar no hace lo de
   * siempre. Con el mouse, el clic derecho también abre (para mirarlo en la computadora).
   */
  function mantener(nodo, { alMantener, ms = 350, puede, visual = nodo }) {
    let t = 0, inicio = null, ultimo = -1e9;
    const cancelar = () => { clearTimeout(t); visual.classList.remove('dt-apretando'); inicio = null; };
    const disparar = (ev) => {
      cancelar();
      ultimo = performance.now();
      alMantener(ev);
    };
    nodo.addEventListener('pointerdown', (ev) => {
      if ((ev.pointerType === 'mouse' && ev.button !== 0) || ocupados || (puede && !puede())) return;
      inicio = { x: ev.clientX, y: ev.clientY, id: ev.pointerId };
      if (!quieto()) visual.classList.add('dt-apretando');
      clearTimeout(t);
      t = setTimeout(() => disparar(ev), ms);
    });
    nodo.addEventListener('pointermove', (ev) => {
      if (!inicio || ev.pointerId !== inicio.id) return;
      if (Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 8) cancelar();
    });
    ['pointerup', 'pointercancel'].forEach((tipo) => nodo.addEventListener(tipo, () => { if (inicio) cancelar(); }));
    nodo.addEventListener('click', (ev) => { if (performance.now() - ultimo < 700) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    nodo.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (ocupados || (puede && !puede())) return;
      if (performance.now() - ultimo > 700) disparar(ev);
    });
    return { cancelar };
  }

  // ------------------------------------------------------------ el menú de mantener apretado
  /**
   * Un menú corto como el de iOS: lo apretado se levanta apenas (una copia, sobre un velo) y el menú crece
   * desde ahí. Una opción con `sub` cambia el menú por lo que arma `sub(contenedor, volver)`.
   */
  function menu(tel, { haptico, icono }) {
    const capa = el('div', 'dt-menu-capa');
    capa.hidden = true;
    capa.innerHTML = '<div class="dt-menu-velo"></div><div class="dt-menu-vista"></div><div class="dt-menu" role="menu"></div>';
    tel.appendChild(capa);
    const vista = capa.querySelector('.dt-menu-vista');
    const caja = capa.querySelector('.dt-menu');
    let abierto = null;
    let cerrando = 0;
    capa.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    capa.querySelector('.dt-menu-velo').addEventListener('click', () => cerrar());
    document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && abierto) cerrar(); });

    const fila = (o) => {
      const b = el('button', 'dt-menu-fila' + (o.tipo ? ' ' + o.tipo : '') + (o.separada ? ' separada' : ''));
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.appendChild(el('span', null, o.texto));
      if (o.detalle) b.appendChild(el('small', null, o.detalle));
      else if (o.icono) b.insertAdjacentHTML('beforeend', icono(o.icono));
      if (o.desactivada) b.disabled = true;
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (o.sub) { if (haptico) haptico('suave'); cambiar((cont) => o.sub(cont, () => cambiar(armarOpciones, true))); return; }
        cerrar(() => o.accion && o.accion());
      });
      return b;
    };
    function armarOpciones(cont) { abierto.opciones.forEach((o) => cont.appendChild(fila(o))); }

    /** Cambia lo de adentro con su alto animado: lo nuevo entra de costado. */
    function cambiar(armarCon, atras) {
      const h0 = caja.offsetHeight;
      const dentro = el('div', 'dt-menu-dentro' + (atras ? ' desde-izq' : ''));
      armarCon(dentro);
      caja.innerHTML = '';
      caja.appendChild(dentro);
      if (h0 && !quieto()) {
        caja.style.height = `${h0}px`;
        const h1 = dentro.offsetHeight;
        void caja.offsetHeight;
        caja.style.height = `${h1}px`;
        setTimeout(() => { if (caja.firstChild === dentro) caja.style.height = ''; }, 280);
        ubicar(h1);
      } else ubicar(dentro.offsetHeight);
    }

    /** Dónde va el menú: debajo de lo levantado o arriba; si no entra, lo levantado se corre. */
    function ubicar(alto) {
      const t = tel.getBoundingClientRect();
      const r = abierto.rect;
      const estilo = getComputedStyle(tel);
      const arriba = parseFloat(estilo.getPropertyValue('--arriba')) || 58;
      const abajo = (parseFloat(estilo.getPropertyValue('--abajo')) || 28) + 12;
      const ancho = caja.offsetWidth || 236;
      const izq = Math.min(Math.max(14, r.left - t.left), t.width - 14 - ancho);
      const debajo = r.bottom - t.top + 10;
      let corre = 0, top = debajo, origen = '30% 0%';
      if (debajo + alto > t.height - abajo) {
        if (r.top - t.top - 10 - alto >= arriba) { top = r.top - t.top - 10 - alto; origen = '30% 100%'; }
        else {
          // Ni arriba ni abajo: lo levantado sube lo que haga falta (sin pasar de la hora) y el menú va debajo.
          corre = Math.max(arriba - (r.top - t.top), t.height - abajo - (debajo + alto));
          top = debajo + corre;
        }
      }
      caja.style.transformOrigin = origen;
      vista.style.setProperty('--dt-corre', `${corre.toFixed(1)}px`);
      caja.style.left = `${izq.toFixed(1)}px`;
      caja.style.top = `${top.toFixed(1)}px`;
    }

    let ultimoOrigen = null;
    function abrir(origen, { opciones, clase }) {
      if (abierto) return;
      // Si el anterior todavía se estaba cerrando, termina ya.
      if (cerrando) { clearTimeout(cerrando); cerrando = 0; if (ultimoOrigen) ultimoOrigen.classList.remove('dt-origen-levantado'); ocupar(false); }
      ultimoOrigen = origen;
      caja.innerHTML = '';
      const t = tel.getBoundingClientRect();
      const r = origen.getBoundingClientRect();
      abierto = { origen, opciones, rect: r };
      ocupar(true);
      vista.innerHTML = '';
      vista.className = 'dt-menu-vista' + (clase ? ' ' + clase : '');
      const copia = origen.cloneNode(true);
      copia.classList.remove('dt-apretando', 'nuevo', 'entra');
      copia.removeAttribute('style');
      vista.appendChild(copia);
      Object.assign(vista.style, { left: `${r.left - t.left}px`, top: `${r.top - t.top}px`, width: `${r.width}px` });
      origen.classList.add('dt-origen-levantado');
      caja.style.height = '';
      caja.style.transformOrigin = '30% 0%';
      capa.hidden = false;
      cambiar(armarOpciones);
      void capa.offsetWidth;
      capa.classList.add('abierto');
      if (haptico) haptico('toque');
    }

    function cerrar(despues) {
      if (!abierto) return;
      const { origen } = abierto;
      abierto = null;
      capa.classList.remove('abierto');
      vista.style.setProperty('--dt-corre', '0px');
      // Lo que se elige pasa cuando lo levantado ya volvió a su lugar.
      cerrando = setTimeout(() => {
        cerrando = 0;
        capa.hidden = true;
        vista.innerHTML = '';
        caja.innerHTML = '';
        origen.classList.remove('dt-origen-levantado');
        ocupar(false);
        if (despues) despues();
      }, quieto() ? 0 : 230);
    }

    return { abrir, cerrar, get abierto() { return !!abierto; } };
  }

  // ------------------------------------------------------------ deslizar para borrar
  const abiertas = new Set();
  document.addEventListener('pointerdown', (ev) => {
    abiertas.forEach((f) => { if (!f.contains(ev.target)) f._cerrar(); });
  }, true);
  /**
   * Una fila que se desliza a la izquierda y destapa «Borrar»: suelta a la mitad del botón, queda abierta;
   * pasado el tope (un poco más de la mitad de la fila) vibra, el botón la llena y al soltar se borra.
   */
  function deslizar(fila, { etiqueta, alBorrar, haptico, puede }) {
    const frente = el('div', 'dt-frente');
    while (fila.firstChild) frente.appendChild(fila.firstChild);
    const accion = el('button', 'dt-accion');
    accion.type = 'button';
    accion.tabIndex = -1;
    accion.appendChild(el('span', null, etiqueta));
    fila.classList.add('dt-desliza');
    fila.append(accion, frente);
    const ANCHO = 80;
    let x = 0, g = null, pasado = false, ultimo = -1e9, borrando = false;
    const tope = () => Math.max(ANCHO * 1.6, fila.clientWidth * 0.58);
    function poner(nx, animar) {
      x = nx;
      const dur = animar && !quieto() ? '0.3s' : '0s';
      frente.style.transition = `transform ${dur} cubic-bezier(0.2, 0.8, 0.2, 1)`;
      accion.style.transition = `width ${dur} cubic-bezier(0.2, 0.8, 0.2, 1), background 0.18s`;
      frente.style.transform = x ? `translate3d(${x.toFixed(1)}px, 0, 0)` : '';
      accion.style.width = `${Math.max(0, -x).toFixed(1)}px`;
      accion.classList.toggle('lleno', pasado);
      fila.classList.toggle('dt-corrida', !!x);
    }
    fila._cerrar = () => { if (x) { pasado = false; poner(0, true); } abiertas.delete(fila); fila.classList.remove('dt-abierta'); };
    fila.addEventListener('pointerdown', (ev) => {
      if ((ev.pointerType === 'mouse' && ev.button !== 0) || borrando) return;
      g = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, base: x, decidido: false, t0: performance.now() };
    });
    fila.addEventListener('pointermove', (ev) => {
      if (!g || ev.pointerId !== g.id) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        if (ocupados || (puede && !puede())) { g = null; return; }
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { g = null; return; }
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        // Para la derecha, con la fila cerrada, es de las pestañas.
        if (dx > 0 && !g.base) { g = null; return; }
        g.decidido = true;
        abiertas.forEach((f) => { if (f !== fila) f._cerrar(); });
        try { fila.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
      }
      ev.preventDefault();
      let nx = g.base + dx;
      // A la derecha no hay nada: cede poco.
      if (nx > 0) nx *= 0.25;
      // Pasado el tope, se siente: cuesta más moverla.
      const T = tope();
      if (-nx > T) nx = -(T + (-nx - T) * 0.35);
      const ahora = -nx >= T;
      if (ahora !== pasado) { pasado = ahora; if (haptico) haptico(ahora ? 'toque' : 'suave'); }
      poner(nx, false);
    });
    const soltar = (ev) => {
      if (!g || ev.pointerId !== g.id) return;
      const decidido = g.decidido;
      const v = (ev.clientX - g.x0) / Math.max(1, performance.now() - g.t0);
      g = null;
      if (!decidido) return;
      ultimo = performance.now();
      if (ev.type === 'pointercancel') { pasado = false; poner(0, true); return; }
      if (pasado) { borrar(); return; }
      // Un tirón rápido para la izquierda también abre; para la derecha, cierra.
      const abre = -x > ANCHO / 2 || (v < -0.5 && -x > 16);
      pasado = false;
      if (abre && v < 0.5) { poner(-ANCHO, true); abiertas.add(fila); fila.classList.add('dt-abierta'); }
      else fila._cerrar();
    };
    fila.addEventListener('pointerup', soltar);
    fila.addEventListener('pointercancel', soltar);
    // El toque que llega después de deslizar, o con la fila abierta, no abre lo de siempre: la cierra.
    fila.addEventListener('click', (ev) => {
      if (ev.target.closest('.dt-accion')) return;
      if (performance.now() - ultimo < 400 || x) { ev.stopPropagation(); ev.preventDefault(); if (x && performance.now() - ultimo >= 400) fila._cerrar(); }
    }, true);
    accion.addEventListener('click', (ev) => { ev.stopPropagation(); borrar(); });
    function borrar() {
      if (borrando) return;
      borrando = true;
      pasado = true;
      abiertas.delete(fila);
      if (haptico) haptico('toque');
      // Se va del todo para la izquierda y después se cierra el renglón.
      poner(-fila.clientWidth, true);
      setTimeout(() => colapsar(fila, () => alBorrar(fila)), quieto() ? 0 : 200);
    }
    return {
      // Para las capturas: llevarla a mano (en píxeles, para la izquierda negativos) y soltarla.
      llevar(nx) { const T = tope(); pasado = -nx >= T; poner(nx, true); },
      abrir() { pasado = false; poner(-ANCHO, true); abiertas.add(fila); fila.classList.add('dt-abierta'); },
      borrar,
    };
  }

  // ------------------------------------------------------------ el velo de espera y la alerta
  function velo(tel) {
    const v = el('div', 'dt-velo');
    v.hidden = true;
    v.setAttribute('role', 'status');
    v.setAttribute('aria-live', 'polite');
    const r = ruedita('grande');
    const p = el('p');
    v.append(r, p);
    tel.appendChild(v);
    v.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    let espera = 0;
    let ocupado = false;
    return {
      mostrar(texto) {
        clearTimeout(espera);
        if (!ocupado) { ocupado = true; ocupar(true); }
        v.querySelector('.dt-listo')?.remove();
        r.hidden = false;
        p.textContent = texto;
        v.hidden = false;
        void v.offsetWidth;
        v.classList.add('visible');
      },
      /** Terminó: el visto bueno un momento y el velo se va. */
      listo(texto, despues) {
        r.hidden = true;
        v.insertAdjacentHTML('afterbegin', '<svg class="dt-listo" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>');
        if (texto) p.textContent = texto;
        espera = setTimeout(() => this.ocultar(despues), 900);
      },
      ocultar(despues) {
        v.classList.remove('visible');
        espera = setTimeout(() => {
          v.hidden = true;
          if (ocupado) { ocupado = false; ocupar(false); }
          if (despues) despues();
        }, quieto() ? 0 : 280);
      },
      get visible() { return !v.hidden; },
    };
  }

  /** La alerta del sistema: título, texto, «Cancelar» (en negrita, a la izquierda) y lo que hace, en rojo si borra. */
  function alerta(tel, { titulo, texto, cancelar, confirmar, peligro = true, alConfirmar }) {
    const capa = el('div', 'dt-alerta-capa');
    capa.setAttribute('role', 'alertdialog');
    const caja = el('div', 'dt-alerta');
    caja.append(el('h4', null, titulo), el('p', null, texto));
    const botones = el('div', 'dt-alerta-botones');
    const bCancelar = el('button', 'cancelar', cancelar);
    const bConfirmar = el('button', peligro ? 'peligro' : '', confirmar);
    [bCancelar, bConfirmar].forEach((b) => { b.type = 'button'; });
    botones.append(bCancelar, bConfirmar);
    caja.appendChild(botones);
    capa.appendChild(caja);
    capa.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    tel.appendChild(capa);
    ocupar(true);
    void capa.offsetWidth;
    capa.classList.add('visible');
    const cerrar = (despues) => {
      capa.classList.remove('visible');
      setTimeout(() => { capa.remove(); ocupar(false); if (despues) despues(); }, quieto() ? 0 : 220);
    };
    bCancelar.addEventListener('click', () => cerrar());
    bConfirmar.addEventListener('click', () => cerrar(alConfirmar));
    return { cerrar, confirmar: () => bConfirmar.click() };
  }

  // ------------------------------------------------------------ deslizar para abajo para volver a leer
  /**
   * Arriba de todo del scroll, tirar para abajo baja la página con el dedo y destapa la ruedita, que se arma
   * de a un rayo; pasado el umbral vibra, y al soltar gira mientras lee (`alLeer(listo)`).
   */
  function tirar(zona, scroll, { alLeer, haptico, tx }) {
    const lugar = el('div', 'dt-tirar');
    lugar.setAttribute('role', 'status');
    const r = ruedita('parcial grande');
    const txt = el('span', 'dt-tirar-txt');
    lugar.append(r, txt);
    zona.appendChild(lugar);
    const UMBRAL = 72, LEYENDO = 58, MAX = 130;
    let y = 0, g = null, armado = false, leyendo = false, ultimo = -1e9;
    function poner(ny, animar) {
      y = ny;
      const dur = animar && !quieto() ? '0.42s' : '0s';
      scroll.style.transition = `transform ${dur} cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.18s ease`;
      scroll.style.transform = y > 0.5 ? `translate3d(0, ${y.toFixed(1)}px, 0)` : '';
      lugar.style.transition = `opacity ${animar ? '0.3s' : '0s'}, transform ${dur} cubic-bezier(0.2, 0.8, 0.2, 1)`;
      lugar.style.opacity = leyendo ? '1' : Math.min(1, y / 34).toFixed(2);
      lugar.style.transform = `translate3d(-50%, ${(Math.min(y, UMBRAL) * 0.22).toFixed(1)}px, 0)`;
      const k = leyendo ? 8 : Math.ceil(Math.min(1, y / UMBRAL) * 8);
      r.querySelectorAll('i').forEach((p, i) => p.classList.toggle('ve', i < k));
    }
    const resistir = (d) => MAX * (1 - Math.exp(-Math.max(0, d) / (MAX * 1.1)));
    function leer() {
      leyendo = true;
      armado = false;
      r.classList.remove('parcial');
      txt.textContent = tx('sueno.leer.leyendo');
      lugar.setAttribute('aria-label', txt.textContent);
      poner(LEYENDO, true);
      txt.textContent = '';
      alLeer(() => {
        txt.textContent = tx('sueno.leer.listo');
        lugar.classList.add('listo');
        setTimeout(() => {
          leyendo = false;
          poner(0, true);
          setTimeout(() => { lugar.classList.remove('listo'); r.classList.add('parcial'); txt.textContent = ''; }, 420);
        }, 1000);
      });
    }
    const puede = () => !leyendo && scroll.scrollTop <= 0 && !ocupados;
    scroll.addEventListener('pointerdown', (ev) => {
      g = null;
      if ((ev.pointerType === 'mouse' && ev.button !== 0) || !puede()) return;
      g = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false };
    });
    scroll.addEventListener('pointermove', (ev) => {
      if (!g || ev.pointerId !== g.id) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        if (dy < -6 || Math.abs(dx) > 14) { g = null; return; }
        if (dy < 8 || Math.abs(dx) > dy) return;
        g.decidido = true;
        try { scroll.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
      }
      ev.preventDefault();
      const ny = resistir(dy - 8);
      const arma = ny >= UMBRAL;
      if (arma && !armado && haptico) haptico('toque');
      armado = arma;
      poner(ny, false);
    });
    const soltar = (ev) => {
      if (!g || ev.pointerId !== g.id) return;
      const decidido = g.decidido;
      g = null;
      if (!decidido) return;
      ultimo = performance.now();
      if (armado && ev.type === 'pointerup') leer(); else { armado = false; poner(0, true); }
    };
    scroll.addEventListener('pointerup', soltar);
    scroll.addEventListener('pointercancel', soltar);
    scroll.addEventListener('click', (ev) => { if (performance.now() - ultimo < 400) { ev.stopPropagation(); ev.preventDefault(); } }, true);
    // En el iPhone, arriba de todo, el navegador rebota si no se le dice nada (como en Progreso con Ascent).
    let toque = null;
    scroll.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; toque = t && puede() ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
    scroll.addEventListener('touchmove', (ev) => {
      const t = ev.touches[0];
      if (!toque || !t) return;
      const dy = t.clientY - toque.y;
      if (dy > 0 && dy > Math.abs(t.clientX - toque.x)) ev.preventDefault();
    }, { passive: false });
    // Con la rueda o el trackpad, lo mismo: arriba de todo, seguir subiendo; lo que venía de antes (la inercia) no cuenta.
    let rueda = 0, ultimaRueda = -1e9, finDeRueda = 0;
    scroll.addEventListener('wheel', (ev) => {
      const antes = ultimaRueda;
      ultimaRueda = performance.now();
      if (!rueda && (ev.deltaY >= 0 || !puede() || ultimaRueda - antes < 200)) return;
      ev.preventDefault();
      rueda = Math.max(0, rueda - ev.deltaY);
      const ny = resistir(rueda * 0.8);
      const arma = ny >= UMBRAL;
      if (arma && !armado && haptico) haptico('toque');
      armado = arma;
      poner(ny, false);
      clearTimeout(finDeRueda);
      finDeRueda = setTimeout(() => { rueda = 0; if (armado) leer(); else poner(0, true); }, 260);
    }, { passive: false });
    return {
      // Para las capturas: tirar hasta `px` sin soltar, o leer de una.
      tirarHasta(px) { leyendo = false; armado = px >= UMBRAL; poner(px, true); },
      soltar() { if (armado) leer(); else poner(0, true); },
      leer,
    };
  }

  /** Si el gesto que empieza en `objetivo` hacia `dx` es de una fila que se desliza (y no de las pestañas). */
  function gestoPropio(objetivo, dx) {
    const f = objetivo && objetivo.closest ? objetivo.closest('.dt-desliza') : null;
    return !!f && (dx < 0 || f.classList.contains('dt-abierta'));
  }

  return {
    ruedita, colapsar, aviso, franja, teclado, mantener, menu, deslizar, velo, alerta, tirar, gestoPropio,
    get ocupado() { return ocupados > 0; },
  };
})();
