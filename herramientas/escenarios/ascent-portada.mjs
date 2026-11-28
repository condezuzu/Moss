// Ascent A, «Portada» (27/11, para aprobar): la portada de cada día (entrando, con el aviso, «Entendido» y «Me siento
// bien»), una puerta creciendo hasta su página y volviendo al arrastrar, las cinco páginas (con un ejercicio abierto,
// un músculo tocado, «¿Por qué no estás mejorando?» y la vuelta, el formulario de una meta nueva con la lista y el
// buscador, editar y borrar, un día del año), «En qué se basa», el fondo (la bandeja, deslizar hasta otro cuerpo,
// lo velado, los encuadres, la presencia, solo el cielo y arrastrar la tira con el mouse), los rangos 3, 5 y 7, en
// inglés (con «¿Por qué…?» en inglés) y en un iPhone chico. Deslizar de costado no mueve las secciones de atrás.
export default async function ascentPortada({ pagina, foto, pestana, propuesta, espera }) {
  const ID = 'ascentPortada';
  const ver = async (vista, ms = 1700) => {
    await propuesta(ID, vista);
    await espera(ms);
  };
  const tocar = async (selector, ms = 1100) => {
    await pagina.click(selector);
    await pagina.mouse.move(1, 1);
    await espera(ms);
  };
  // Lo que se está moviendo adentro, frenado en un instante (el render por software no llega a tiempo). Lo que ya
  // terminó no se toca, ni la entrada de la pantalla entera.
  const frenarEn = async (ms) => {
    await pagina.evaluate((t) => {
      const pantalla = document.querySelector('.apo');
      pantalla.getAnimations({ subtree: true }).filter((a) => (a.playState === 'running' || a.playState === 'paused') && a.effect && a.effect.target !== pantalla).forEach((a) => { a.pause(); a.currentTime = t; });
    }, ms);
    await espera(300);
  };
  const soltar = () => pagina.evaluate(() => document.querySelector('.apo').getAnimations({ subtree: true }).filter((a) => a.playState === 'paused').forEach((a) => a.play()));
  /** Baja la página abierta hasta que algo queda a `margen` px del borde de arriba. */
  const bajarA = async (selector, margen = 90) => {
    await pagina.evaluate(([s, m]) => {
      const scroll = document.querySelector('.apo-pag-scroll');
      const n = scroll.querySelector(s);
      scroll.scrollTop += n.getBoundingClientRect().top - scroll.getBoundingClientRect().top - m;
    }, [selector, margen]);
    await espera(450);
  };
  const centro = (selector) => pagina.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, selector);

  // ---- la portada de cada día
  for (const [vista, nombre] of [['aviso', 'aviso'], ['calma', 'calma'], ['casi', 'casi'], ['hecha', 'hecha'], ['descanso', 'descanso'], ['nocheCorta', 'noche-corta'], ['nueva', 'nueva']]) {
    await ver(vista);
    await foto(`apo-${nombre}`);
  }
  // Al llegar: el titular primero y las puertas se asientan de a una.
  await propuesta(ID, null);
  await espera(600);
  await propuesta(ID, 'aviso');
  await frenarEn(250);
  await foto('apo-aviso-entrando');
  await soltar();
  await espera(1400);
  // «Entendido»: el aviso se achica a una línea y las puertas suben a ocupar su lugar.
  await pagina.click('.apo-aviso .apo-pastilla:first-child');
  await espera(240);
  await frenarEn(170);
  await foto('apo-aviso-entendido-moviendo');
  await soltar();
  await espera(1200);
  await foto('apo-aviso-entendido');
  await ver('aviso');
  await tocar('.apo-aviso .apo-pastilla:last-child', 1400);
  await foto('apo-aviso-me-siento-bien');

  // Deslizar de costado sobre la portada no mueve las secciones de atrás: la barra sigue en Progreso.
  await ver('aviso');
  await pagina.mouse.move(330, 500);
  await pagina.mouse.down();
  await pagina.mouse.move(60, 505, { steps: 12 });
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(900);
  await foto('apo-deslizar-de-costado');

  // ---- una puerta crece hasta ser su página y vuelve arrastrando hacia abajo
  await ver('aviso');
  await pagina.click('.apo [data-puerta="fuerza"]');
  await frenarEn(70);
  await foto('apo-puerta-creciendo');
  await frenarEn(190);
  await foto('apo-puerta-creciendo-2');
  await soltar();
  await espera(1400);
  await pagina.mouse.move(196, 330);
  await pagina.mouse.down();
  await pagina.mouse.move(196, 520, { steps: 14 });
  await espera(450);
  await foto('apo-pagina-arrastrando');
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(60);
  await frenarEn(230);
  await foto('apo-pagina-volviendo');
  await soltar();
  await espera(1200);
  await foto('apo-pagina-de-vuelta');
  // Empujar la portada para arriba vuelve a Progreso.
  await pagina.mouse.move(196, 640);
  await pagina.mouse.down();
  await pagina.mouse.move(196, 470, { steps: 12 });
  await espera(400);
  await foto('apo-portada-empujando');
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(1300);
  await foto('apo-volvio-a-progreso');

  // ---- ¿Qué hago hoy?
  await ver('paginaHoy', 2600);
  await foto('apo-pagina-hoy');
  await tocar('.apo-ej', 900);
  await foto('apo-pagina-hoy-por-que');
  await bajarA('.apo-musc', 150);
  await foto('apo-pagina-hoy-2');
  await bajarA('.apo-alrededor', 120);
  await foto('apo-pagina-hoy-3');
  // Después de entrenar, la puerta es «¿Cómo fue hoy?»; en descanso, lo de mañana.
  await ver('hecha');
  await tocar('.apo [data-puerta="hoy"]', 2000);
  await foto('apo-pagina-como-fue');
  await bajarA('.apo-ej', 140);
  await foto('apo-pagina-como-fue-2');
  await ver('descanso');
  await tocar('.apo [data-puerta="hoy"]', 2000);
  await foto('apo-pagina-manana');
  await ver('nueva');
  await tocar('.apo [data-puerta="semana"]', 2000);
  await foto('apo-pagina-semana-nueva');

  // ---- ¿Cómo va mi semana?
  await ver('paginaSemana', 2600);
  await foto('apo-pagina-semana');
  // El músculo se toca en uno de sus trazos (el centro del grupo cae entre las dos piernas).
  const pierna = await centro('.apo-cuerpos [data-musculo="cuadriceps"] path');
  await pagina.mouse.click(pierna.x, pierna.y);
  await pagina.mouse.move(1, 1);
  await espera(900);
  await foto('apo-pagina-semana-musculo');
  await bajarA('.apo-puntos', 160);
  await foto('apo-pagina-semana-2');
  await bajarA('.apo-rutina', 200);
  await foto('apo-pagina-semana-3');

  // ---- ¿Estoy mejorando?, con la puerta a «¿Por qué no estás mejorando?» y la vuelta
  await ver('paginaFuerza', 2600);
  await foto('apo-pagina-fuerza');
  await bajarA('.apo-boton-ancho', 420);
  await foto('apo-pagina-fuerza-2');
  await tocar('.apo-pagina .apo-boton-ancho', 2400);
  await foto('apo-por-que-no-mejoro');
  await tocar('.pqn-atras', 1500);
  await foto('apo-por-que-no-mejoro-vuelve');

  // ---- ¿Llego a mi meta?: cómo llegar, una meta nueva (con la lista y el buscador), editar y borrar
  await ver('paginaMetas', 2600);
  await foto('apo-pagina-metas');
  await tocar('.apo-meta .apo-desplegar', 900);
  await foto('apo-pagina-metas-como-llegar');
  await bajarA('.apo-meta:nth-child(2)', 100);
  await foto('apo-pagina-metas-2');
  await bajarA('.apo-pagina .apo-boton-ancho', 300);
  await tocar('.apo-pagina .apo-boton-ancho', 900);
  await bajarA('.apo-form', 140);
  await foto('apo-meta-nueva');
  await tocar('.apo-form .apo-campo', 900);
  await foto('apo-meta-nueva-lista');
  await pagina.click('.apo-buscar input');
  await pagina.keyboard.type('mancuer', { delay: 50 });
  await espera(700);
  // Con el teclado arriba, el buscador queda arriba y se ven los resultados.
  await bajarA('.apo-form .apo-campo', 70);
  await foto('apo-meta-nueva-buscar');
  await tocar('.apo-lista-scroll .apo-opcion', 900);
  await pagina.click('.apo-paso:first-child input, .apo-numeros > div:first-child input');
  await pagina.keyboard.type('30', { delay: 60 });
  await espera(300);
  await pagina.evaluate(() => document.activeElement && document.activeElement.blur());
  for (let i = 0; i < 8; i++) await pagina.click('.apo-numeros > div:last-child .apo-paso button:last-child');
  await pagina.mouse.move(1, 1);
  await espera(700);
  await bajarA('.apo-form', 140);
  await foto('apo-meta-nueva-lista-para-guardar');
  await tocar('.apo-guardar', 1300);
  await bajarA('.apo-metas', 120);
  await foto('apo-meta-guardada');
  await ver('paginaMetas', 2600);
  await bajarA('[data-meta="sentadilla"] .apo-meta-acciones', 260);
  await tocar('[data-meta="sentadilla"] .apo-meta-acciones .apo-enlace:last-child', 1000);
  await bajarA('.apo-form', 140);
  await foto('apo-meta-editar');
  await tocar('.apo-borrar', 700);
  await foto('apo-meta-borrar');
  await tocar('.apo-confirmar button:first-child', 500);
  await tocar('.apo-cancelar', 800);

  // ---- Tu año y «En qué se basa»
  await ver('paginaAnio', 2600);
  await foto('apo-pagina-anio');
  const dia = await centro('.apo-mapa [data-fecha="2026-09-30"]');
  await pagina.mouse.click(dia.x, dia.y);
  await pagina.mouse.move(1, 1);
  await espera(700);
  await bajarA('.apo-mapa', 160);
  await foto('apo-pagina-anio-dia');
  await bajarA('.apo-cifras', 150);
  await foto('apo-pagina-anio-2');
  await ver('aviso');
  await tocar('.apo-ayuda', 1800);
  await foto('apo-en-que-se-basa');

  // ---- el fondo: la bandeja crece desde el sello; deslizar cambia el fondo en vivo
  await ver('fondo', 700);
  await frenarEn(200);
  await foto('apo-fondo-abriendo');
  await soltar();
  await espera(1600);
  await foto('apo-fondo');
  const deslizar = async (i) => {
    await pagina.evaluate((k) => document.querySelector('.apo-minis').scrollTo({ left: k * 80, behavior: 'instant' }), i);
    await espera(1300);
  };
  await deslizar(3);
  await foto('apo-fondo-luna');
  await deslizar(5);
  await foto('apo-fondo-velado');
  await deslizar(1);
  await foto('apo-fondo-polvo');
  await deslizar(4);
  await tocar('.apo-segmentos [data-encuadre="horizonte"]', 1200);
  await foto('apo-fondo-horizonte');
  await tocar('.apo-segmentos [data-encuadre="lejos"]', 1200);
  await foto('apo-fondo-lejos');
  await tocar('.apo-segmentos [data-encuadre="esquina"]', 900);
  await pagina.evaluate(() => { const r = document.querySelector('.apo-deslizador input'); r.value = '1'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await espera(900);
  await foto('apo-fondo-protagonista');
  await tocar('.apo-interruptor-fila', 1200);
  await foto('apo-fondo-solo-cielo');
  await tocar('.apo-interruptor-fila', 500);
  await pagina.evaluate(() => { const r = document.querySelector('.apo-deslizador input'); r.value = '0.5'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await deslizar(0);
  // Con el mouse, la tira se arrastra (y la barra sigue en Progreso).
  const tira = await centro('.apo-minis');
  await pagina.mouse.move(tira.x + 40, tira.y);
  await pagina.mouse.down();
  await pagina.mouse.move(tira.x - 150, tira.y, { steps: 12 });
  await espera(700);
  await foto('apo-fondo-arrastrando-con-el-mouse');
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(1300);
  await foto('apo-fondo-tras-arrastrar');
  await deslizar(0);
  await tocar('.apo-band-cerrar', 900);
  await foto('apo-fondo-cerrado');

  // ---- otros rangos
  for (const n of [3, 5, 7]) {
    await ver('rango' + n);
    await foto(`apo-rango${n}`);
  }

  // ---- en inglés: la portada y una página
  await pagina.evaluate(() => window.__idioma('en'));
  await ver('en');
  await foto('apo-en');
  await tocar('.apo [data-puerta="hoy"]', 2000);
  await foto('apo-en-hoy');
  await ver('en');
  await tocar('.apo [data-puerta="metas"]', 2000);
  await foto('apo-en-metas');
  // Desde inglés, «¿Por qué no estás mejorando?» sale en inglés, y «‹» vuelve a la misma página.
  await ver('en');
  await tocar('.apo [data-puerta="fuerza"]', 2000);
  await tocar('.apo-pagina .apo-boton-ancho', 2400);
  await foto('apo-en-por-que');
  await tocar('.pqn-atras', 1500);
  await foto('apo-en-por-que-vuelve');
  await pagina.evaluate(() => window.__idioma('es'));

  // ---- un iPhone chico: si no entra todo, el año pasa adentro de «¿Llego a mi meta?»
  await pagina.setViewportSize({ width: 375, height: 667 });
  await espera(800);
  await ver('aviso');
  await foto('apo-chico-aviso');
  await ver('calma');
  await foto('apo-chico-calma');
  await ver('nueva');
  await foto('apo-chico-nueva');
  await pagina.evaluate(() => window.__idioma('en'));
  await ver('en');
  await foto('apo-chico-en');
  await pagina.evaluate(() => window.__idioma('es'));
  await ver('paginaMetas', 2600);
  await bajarA('.apo-pagina .apo-boton-ancho', 200);
  await foto('apo-chico-metas-con-el-anio');
  await pagina.setViewportSize({ width: 393, height: 852 });
  await espera(800);

  // Como estaba: cerrada y en Inicio.
  await propuesta(ID, null);
  await espera(500);
  await pestana(0);
}
