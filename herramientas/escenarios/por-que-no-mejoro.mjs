// ¿Por qué no estás mejorando? (27/11, para aprobar): los carriles con el press de banca estancado (entrando, ya
// quietos, con el dedo arrastrando, una semana día por día, una de antes de Moss y la de ahora), «Antes y ahora» creciendo y crecido,
// semana por semana con un renglón abierto, uno que sí sube, uno que bajó (el press militar), uno con pocos datos, la
// hoja para elegir (y buscando), en inglés, el que no sube desde antes de las 12 semanas, «En qué se basa», sin el
// carril de calorías («sin déficit») y «‹», que vuelve a Progreso. Al final, lo arreglado el 27/11, con su comprobación:
// la hoja abierta y otro botón (el teléfono no queda «con hoja»), un cambio de idioma justo antes de abrir la hoja (no
// la cierra), Inicio como estaba al cerrar (Ascent sin vincular) y, desde la Portada de Ascent, «‹» de vuelta a ella.
export default async function porQueNoMejoro({ pagina, foto, pestana, propuesta, hojaAbierta, espera }) {
  const ver = async (vista, arg) => {
    await propuesta('porQueNoMejoro', vista, arg);
    // Los carriles se dibujan de izquierda a derecha al entrar.
    await espera(2300);
  };
  /** Baja hasta que algo de la pantalla queda a `margen` px del borde de arriba del teléfono. */
  const bajarA = async (selector, margen) => {
    await pagina.evaluate(([s, m]) => {
      const scroll = document.querySelector('.pqn-scroll');
      scroll.scrollTop += document.querySelector('.pqn ' + s).getBoundingClientRect().top - scroll.getBoundingClientRect().top - m;
    }, [selector, margen]);
    await espera(350);
  };
  const tocar = async (selector) => {
    await pagina.click('.pqn ' + selector);
    await espera(800);
  };
  // Lo que se mueve dentro de la pantalla, frenado en un instante: el render por software no llega a tiempo.
  const frenarEn = async (ms) => {
    await pagina.evaluate((t) => document.querySelectorAll('.pqn-scroll').forEach((n) => n.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = t; })), ms);
    await espera(250);
  };
  const soltar = () => pagina.evaluate(() => document.querySelectorAll('.pqn-scroll').forEach((n) => n.getAnimations({ subtree: true }).forEach((a) => a.play())));
  /** Una comprobación: si no da, el escenario se corta con lo que vio. */
  const comprobar = async (que, f, arg) => {
    const r = await pagina.evaluate(f, arg);
    if (r !== true) throw new Error(`por-que-no-mejoro: ${que} (${JSON.stringify(r)})`);
  };
  const sinHoja = () => comprobar('el teléfono quedó «con hoja»', () => !document.querySelector('.tel').classList.contains('con-hoja') || document.querySelector('.tel').className);
  // Ascent, como estaba al empezar (la galería abre sin vincular): al cerrar, la pantalla vuelve a eso.
  const vinculada = await pagina.evaluate(() => window.Galeria.secciones.ascent.vinculada);
  const sinVincular = () => comprobar('Ascent no quedó como estaba', (v) => window.Galeria.secciones.ascent.vinculada === v, vinculada);

  await propuesta('porQueNoMejoro', 'carriles');
  await frenarEn(640);
  await foto('por-que-carriles-entrando');
  await soltar();
  await espera(2000);
  await foto('por-que-carriles');
  // La raya sigue al dedo: de la sexta semana a la novena, con el dedo todavía abajo.
  const r = await pagina.evaluate(() => { const b = document.querySelector('.pqn-rayas').getBoundingClientRect(); return { x: b.left, y: b.top, ancho: b.width, alto: b.height }; });
  await pagina.mouse.move(r.x + r.ancho * 0.46, r.y + r.alto * 0.45);
  await pagina.mouse.down();
  await pagina.mouse.move(r.x + r.ancho * 0.7, r.y + r.alto * 0.5, { steps: 14 });
  await espera(500);
  await foto('por-que-carriles-dedo');
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await espera(500);
  // De un toque, la semana del 5 de octubre: un día sin anotar, una noche corta y una sin datos.
  await pagina.mouse.click(r.x + (r.ancho * 9.5) / 12, r.y + r.alto * 0.5);
  await pagina.mouse.move(1, 1);
  await espera(500);
  await bajarA('.pqn-de-comida', 70);
  await foto('por-que-carriles-semana');
  // Y la del 17 de agosto, de antes de Moss: solo la sesión de Ascent.
  await bajarA('.pqn-cab', 60);
  await pagina.mouse.click(r.x + (r.ancho * 2.5) / 12, r.y + r.alto * 0.5);
  await pagina.mouse.move(1, 1);
  await espera(500);
  await bajarA('.pqn-de-sueno', 70);
  await foto('por-que-antes-de-moss');
  // Y la de ahora, en curso: la noche de hoy es la de la galería (7 h 23).
  await bajarA('.pqn-cab', 60);
  await pagina.mouse.click(r.x + (r.ancho * 11.5) / 12, r.y + r.alto * 0.5);
  await pagina.mouse.move(1, 1);
  await espera(500);
  await bajarA('.pqn-dias-titulo', 70);
  await foto('por-que-semana-en-curso');

  await propuesta('porQueNoMejoro', 'antesYAhora');
  await espera(2300);
  await bajarA('.pqn-cab', 60);
  await tocar('.pqn-veredicto');
  await pagina.click('.pqn .pqn-veredicto');
  await frenarEn(190);
  await foto('por-que-antes-y-ahora-creciendo');
  await soltar();
  await espera(900);
  await foto('por-que-antes-y-ahora');
  await bajarA('.pqn-cuadro', 110);
  await foto('por-que-antes-y-ahora-2');

  await ver('semanas');
  await foto('por-que-semanas');
  await tocar('.pqn-sem:nth-of-type(3) .pqn-sem-fila');
  await bajarA('.pqn-semanas', 60);
  await foto('por-que-semanas-detalle');
  await bajarA('.pqn-sem-desde', 330);
  await foto('por-que-semanas-2');

  await ver('mejorando');
  await foto('por-que-mejorando');
  await bajarA('.pqn-de-comida', 70);
  await foto('por-que-mejorando-semana');

  // El que bajó: el press militar, con «Antes y ahora».
  await ver('bajo');
  await foto('por-que-bajo');
  await tocar('.pqn-veredicto');
  await bajarA('.pqn-cuadro', 110);
  await foto('por-que-bajo-cuadro');

  await ver('pocosDatos');
  await foto('por-que-pocos-datos');

  await ver('elegir');
  await hojaAbierta('pqn-hoja');
  await espera(400);
  await foto('por-que-elegir');
  await pagina.click('.pqn-buscar input');
  await pagina.keyboard.type('press', { delay: 60 });
  await espera(900);
  await foto('por-que-elegir-buscar');
  await pagina.click('.pqn-hoja-cerrar');
  await espera(700);

  await pagina.evaluate(() => window.__idioma('en'));
  await ver('en');
  await foto('por-que-en');
  await bajarA('.pqn-de-comida', 70);
  await foto('por-que-en-semana');
  await bajarA('.pqn-cab', 60);
  await tocar('.pqn-veredicto');
  await foto('por-que-en-antes-y-ahora');
  await bajarA('.pqn-cuadro', 110);
  await foto('por-que-en-antes-y-ahora-2');
  await pagina.evaluate(() => window.__idioma('es'));

  // El que no sube desde antes de estas 12 semanas (el curl con barra), con su cuadro de una sola sesión de antes.
  await ver('carriles', 'curl_barra');
  await foto('por-que-desde-antes');
  await tocar('.pqn-veredicto');
  await bajarA('.pqn-veredicto', 70);
  await foto('por-que-desde-antes-cuadro');

  // «En qué se basa», desplegado.
  await ver('carriles');
  await bajarA('.pqn-basa', 300);
  await tocar('.pqn-basa-boton');
  await bajarA('.pqn-basa', 120);
  await foto('por-que-en-que-se-basa');

  // Con «sin déficit», sin el carril de calorías ni la comida del día por día.
  await pagina.evaluate(() => window.__seguridad('sinDeficit', true));
  await ver('carriles');
  await foto('por-que-sin-deficit');
  await bajarA('.pqn-de-sueno', 70);
  await foto('por-que-sin-deficit-semana');
  await pagina.evaluate(() => window.__seguridad('sinDeficit', false));

  // «‹», abierta desde un botón de la galería: vuelve a Progreso, y Ascent, como estaba.
  await ver('carriles');
  await tocar('.pqn-atras');
  await espera(400);
  await foto('por-que-volver');
  await sinVincular();

  // ---- lo arreglado el 27/11
  // Con la hoja abierta, otra vista: la hoja baja y la barra vuelve.
  await ver('elegir');
  await hojaAbierta('pqn-hoja');
  await propuesta('porQueNoMejoro', 'carriles');
  await espera(900);
  await sinHoja();
  await foto('por-que-hoja-y-otra-vista');
  // Con la hoja abierta, se cierra la propuesta: Inicio entero, con la barra y sin achicarse.
  await propuesta('porQueNoMejoro', 'elegir');
  await hojaAbierta('pqn-hoja');
  await propuesta('porQueNoMejoro', null);
  await espera(900);
  await pestana(0);
  await espera(900);
  await sinHoja();
  await sinVincular();
  await foto('por-que-al-cerrar-inicio');
  // Un cambio de idioma justo antes de abrir la hoja (como lo hace otra propuesta al cerrarse) ya no la cierra.
  await pagina.evaluate(() => { document.querySelector('#s-idioma [data-valor="es"]').click(); window.__propuesta('porQueNoMejoro', 'elegir'); });
  await espera(1200);
  await comprobar('la hoja se cerró sola', () => { const h = document.querySelector('.pqn-hoja'); return !!h && !h.hidden && !h.classList.contains('saliendo'); });
  await foto('por-que-idioma-y-hoja');
  await propuesta('porQueNoMejoro', null);
  await espera(900);
  await sinHoja();

  // Desde la Portada de Ascent: su «¿Por qué no estás mejorando?» abre esta pantalla y «‹» vuelve a su página.
  if (await pagina.evaluate(() => !!document.querySelector('[data-propuesta="ascentPortada"][data-vista="paginaFuerza"]'))) {
    await propuesta('ascentPortada', 'paginaFuerza');
    await espera(2600);
    // Tocado desde la página: un clic de Playwright correría la galería entera para mostrar el botón.
    await pagina.evaluate(() => document.querySelector('.apo-pagina .apo-boton-ancho').click());
    await espera(2400);
    await foto('por-que-desde-la-portada');
    await tocar('.pqn-atras');
    await espera(1200);
    await foto('por-que-desde-la-portada-vuelve');
    await propuesta('ascentPortada', null);
    await espera(900);
  }

  // Como estaba: Ascent como al empezar (la Portada la deja vinculada al cerrarse) y en Inicio.
  await pagina.evaluate((v) => window.Galeria.vincular(v), vinculada);
  await pestana(0);
}
