// La sección de Ascent, propuesta B: «El cuerpo manda» (27/11, para aprobar; galeria/src/propuestas/11-ascent-cuerpo.js).
// Cada vista quieta y, de las que se mueven, un cuadro a mitad de camino: la lámina dibujándose al entrar, el cambio de
// lente con las líneas saliendo del músculo, el cuerpo girando con el dedo, el músculo acercándose a la lupa y una
// página creciendo desde su enlace. También: el selector de rango del panel con la propuesta abierta, «¿Por qué no estás
// mejorando?» desde la vista en inglés y Progreso al cerrar (Ascent sin vincular, como estaba). Al final, todo como
// estaba: en español, con el rango de antes y en Inicio.
export default async function ascentCuerpo({ pagina, foto, pestana, propuesta, espera }) {
  const ID = 'ascentCuerpo';
  const ver = async (vista, ms = 3200) => {
    await propuesta(ID, vista);
    await espera(ms);
  };
  // Lo que se está moviendo en la pantalla, frenado en un instante: el render por software no llega a tiempo. Solo lo
  // que corre: lo ya terminado (la entrada de la pantalla, por ejemplo) queda como está.
  const frenarEn = async (ms) => {
    await pagina.evaluate((t) => document.querySelector('.acu').getAnimations({ subtree: true }).filter((a) => a.playState === 'running').forEach((a) => { a.pause(); a.currentTime = t; }), ms);
    await espera(300);
  };
  const soltar = () => pagina.evaluate(() => document.querySelector('.acu').getAnimations({ subtree: true }).filter((a) => a.playState === 'paused').forEach((a) => a.play()));
  // Con click() del elemento: el clic de Playwright lo trae a la vista y puede correr el teléfono entero (.tel).
  const tocar = async (selector, ms = 1600) => {
    await pagina.evaluate((s) => document.querySelector(s).click(), '.acu ' + selector);
    await espera(ms);
  };
  const bajar = async (selector, px) => {
    await pagina.evaluate(([s, y]) => { const n = document.querySelector('.acu ' + s); n.scrollTop = y; }, [selector, px]);
    await espera(500);
  };
  /** Baja la página hasta que `selector` quede a `margen` px del borde de arriba de lo que se desliza. */
  const bajarA = async (contenedor, selector, margen = 14) => {
    await pagina.evaluate(([c, s, m]) => {
      const n = document.querySelector('.acu ' + c);
      n.scrollTop += n.querySelector(s).getBoundingClientRect().top - n.getBoundingClientRect().top - m;
    }, [contenedor, selector, margen]);
    await espera(500);
  };

  // La principal: hoy toca piernas y cuádriceps y glúteos siguen cargados; el rótulo del cuádriceps es el aviso.
  await propuesta(ID, 'aviso');
  await frenarEn(560);
  await foto('acu-aviso-entrando');
  await soltar();
  await espera(3000);
  await foto('acu-aviso');

  // Las otras dos lentes, y el cambio a mitad de camino.
  await tocar('[data-lente="semana"]', 260);
  await frenarEn(220);
  await foto('acu-lente-cambiando');
  await soltar();
  await espera(2400);
  await ver('semana');
  await foto('acu-semana');
  await ver('fatiga');
  await foto('acu-fatiga');

  // Los otros días.
  for (const [vista, nombre] of [['calma', 'acu-calma'], ['casi', 'acu-casi'], ['hecha', 'acu-hecha'], ['descanso', 'acu-descanso'], ['nocheCorta', 'acu-noche-corta'], ['nueva', 'acu-nueva']]) {
    await ver(vista);
    await foto(nombre);
  }
  await tocar('[data-lente="semana"]', 2400);
  await foto('acu-nueva-semana');

  // De espalda: la vista, y girando con el dedo a mitad de camino.
  await ver('espalda');
  await foto('acu-espalda');
  await ver('aviso');
  const caja = await pagina.evaluate(() => { const r = document.querySelector('.acu .acu-cuerpo').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }; });
  await pagina.mouse.move(caja.x, caja.y);
  await pagina.mouse.down();
  await pagina.mouse.move(caja.x - 70, caja.y, { steps: 12 });
  await espera(600);
  await foto('acu-girando');
  await pagina.mouse.move(caja.x - 190, caja.y, { steps: 10 });
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(2600);
  await foto('acu-girado');
  await tocar('[data-lente="semana"]', 2400);
  await foto('acu-espalda-semana');
  await tocar('[data-lente="fatiga"]', 2400);
  await foto('acu-espalda-fatiga');

  // Un músculo de cerca: creciendo desde el músculo, quieto y más abajo en su panel.
  await ver('aviso');
  await tocar('.acu-rotulo[data-musculo="cuadriceps"] .acu-r-abre', 120);
  await frenarEn(200);
  await foto('acu-musculo-creciendo');
  await soltar();
  await espera(2400);
  await foto('acu-musculo-tocado');
  await ver('musculo', 4200);
  await foto('acu-musculo');
  await bajarA('.acu-panel-scroll', '.acu-sec:nth-of-type(2)');
  await foto('acu-musculo-abajo');

  // «Sentadilla, en el tiempo ›» abre «¿Por qué no estás mejorando?»; su «‹» vuelve al cuádriceps de cerca.
  await pagina.evaluate(() => { const s = document.querySelector('.acu .acu-panel-scroll'); const b = s.querySelector('.acu-ir'); s.scrollTop += b.getBoundingClientRect().top - s.getBoundingClientRect().top - 160; });
  await espera(500);
  await foto('acu-musculo-en-el-tiempo');
  await tocar('.acu-panel .acu-ir', 3200);
  await foto('acu-en-el-tiempo');
  await pagina.evaluate(() => document.querySelector('.pqn-atras').click());
  await espera(2600);
  await foto('acu-volver-del-tiempo');

  // El aviso respondido: «Entendido» lo achica a lo que pide hacer.
  await ver('aviso');
  await tocar('.acu-r-resp button', 2600);
  await foto('acu-aviso-entendido');

  // Tu sesión: crece desde el pie de Hoy; un ejercicio abierto con su porqué.
  await ver('aviso');
  await tocar('.acu-sesion', 140);
  await frenarEn(200);
  await foto('acu-sesion-creciendo');
  await soltar();
  await espera(2000);
  await tocar('.acu-ej[aria-expanded]', 1200);
  await foto('acu-sesion');

  // Las páginas de los enlaces de abajo.
  await ver('fuerza', 4200);
  await foto('acu-fuerza');
  await bajarA('.acu-hoja-scroll', '.acu-celda:nth-child(3)', 6);
  await foto('acu-fuerza-abajo');
  // Arrastrar hacia abajo desde el título vuelve: a mitad de camino y ya de vuelta en la portada.
  await bajar('.acu-hoja-scroll', 0);
  const t = await pagina.evaluate(() => { const r = document.querySelector('.acu .acu-hoja-t').getBoundingClientRect(); return { x: r.left + 30, y: r.top + 12 }; });
  await pagina.mouse.move(t.x, t.y);
  await pagina.mouse.down();
  await pagina.mouse.move(t.x, t.y + 70, { steps: 8 });
  await espera(500);
  await foto('acu-fuerza-arrastrando');
  await pagina.mouse.move(t.x, t.y + 150, { steps: 6 });
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(2200);
  await foto('acu-fuerza-de-vuelta');
  await ver('metas', 4200);
  await foto('acu-metas');
  await bajarA('.acu-hoja-scroll', '.acu-meta:nth-of-type(2)', 6);
  await foto('acu-metas-abajo');
  await ver('anio', 4200);
  await foto('acu-anio');
  await bajarA('.acu-hoja-scroll', '.acu-mapa');
  await foto('acu-anio-abajo');

  // Ver como lista y En qué se basa.
  await ver('lista', 4200);
  await foto('acu-lista');
  await bajarA('.acu-hoja-scroll', '.acu-sec:nth-of-type(2) h4');
  await foto('acu-lista-abajo');
  await ver('aviso');
  await tocar('[data-pagina="base"]', 2400);
  await foto('acu-base');

  // El rango: el 1 (el de todo usuario nuevo) y el 5, con la lente Semana, que es la de más tramas.
  await ver('rango1');
  await foto('acu-rango1');
  await tocar('[data-lente="semana"]', 2400);
  await foto('acu-rango1-semana');
  await ver('rango5');
  await foto('acu-rango5');
  await tocar('[data-lente="semana"]', 2400);
  await foto('acu-rango5-semana');
  await tocar('[data-lente="fatiga"]', 2400);
  await foto('acu-rango5-fatiga');

  // El selector «Tu rango en Ascent» del panel, con la propuesta abierta: el medallón y la tinta cambian en el lugar (a
  // mitad de camino y ya quietos). Después, el rango 1 otra vez, como estaba.
  const elegirRango = (n) => pagina.evaluate((v) => document.querySelector(`#s-rango [data-valor="${v}"]`).click(), n);
  await ver('aviso');
  await elegirRango(5);
  await espera(120);
  await frenarEn(260);
  await foto('acu-selector-rango-cambiando');
  await soltar();
  await espera(1600);
  await foto('acu-selector-rango5');
  await elegirRango(1);
  await espera(1600);

  // En inglés: el botón «En inglés» pasa la galería a inglés por sí solo (así se prueba lo que ve el dueño al tocarlo).
  await ver('en');
  await foto('acu-en');
  await tocar('[data-lente="semana"]', 2400);
  await foto('acu-en-semana');
  await tocar('.acu-rotulo[data-musculo="cuadriceps"] .acu-r-abre', 3000);
  await foto('acu-en-musculo');
  // «Squat, over time ›»: «¿Por qué no estás mejorando?» sigue en inglés, y su «‹» vuelve al cuádriceps en inglés.
  await pagina.evaluate(() => { const s = document.querySelector('.acu .acu-panel-scroll'); const b = s.querySelector('.acu-ir'); s.scrollTop += b.getBoundingClientRect().top - s.getBoundingClientRect().top - 160; });
  await espera(500);
  await tocar('.acu-panel .acu-ir', 3200);
  await foto('acu-en-por-que');
  await pagina.evaluate(() => document.querySelector('.pqn-atras').click());
  await espera(2600);
  await foto('acu-en-volver');
  // Al cerrar la propuesta de verdad, la galería vuelve sola al español.
  await propuesta(ID, null);
  await espera(500);
  const idioma = await pagina.evaluate(() => window.Galeria.idioma);
  if (idioma !== 'es') throw new Error('Al cerrar, la galería quedó en ' + idioma);

  // «Progreso ⌄» se va para arriba y deja Progreso como estaba antes de abrir: con Ascent sin vincular («Vincular con
  // Ascent» arriba a la derecha).
  await ver('aviso');
  await tocar('.acu-progreso', 2600);
  await foto('acu-a-progreso');
  const vinculada = await pagina.evaluate(() => window.Galeria.secciones.ascent.vinculada);
  if (vinculada) throw new Error('Al cerrar, Ascent quedó vinculada');
  await propuesta(ID, null);
  await espera(400);
  await pagina.evaluate(() => window.__idioma('es'));
  await pestana(0);
}
