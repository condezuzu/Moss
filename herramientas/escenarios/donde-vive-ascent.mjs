// Dónde vive Ascent (28/11, para aprobar): como hoy (arriba de Progreso, con el gesto a mitad de camino), dentro de
// Progreso con el selector «Cuerpo · Fuerza» (cada carta, el selector cambiando con el dedo, «Cuerpo» y sin vincular),
// en un solo scroll, en su propia pestaña (Fuerza, deslizando a Progreso, Inicio con Perfil arriba y Perfil
// creciendo) y sin vincular con la barra de siempre, y la principal en inglés. Al final todo queda como estaba.
// Con SOLO=hoy,progreso,scroll,pestana,quieto,ingles corre solo esas tandas.
export default async function dondeViveAscent({ pagina, foto, pestana, propuesta, espera }) {
  const solo = (process.env.SOLO || '').split(',').filter(Boolean);
  const toca = (nombre) => !solo.length || solo.includes(nombre);
  const ID = 'dondeViveAscent';
  const ver = async (vista, arg, ms = 1500) => {
    await propuesta(ID, vista, arg);
    await espera(ms);
  };
  const antes = await pagina.evaluate(() => ({ vinculada: Galeria.secciones.ascent.vinculada, idioma: Galeria.idioma, pestana: Galeria.pestana }));
  /** Baja la parte a la vista hasta que `selector` queda a `margen` px del borde de arriba. */
  const bajarA = async (scroll, selector, margen) => {
    await pagina.evaluate(([sc, s, m]) => {
      const caja = [...document.querySelectorAll(sc)].find((n) => n.offsetParent && n.closest('.pr-pantalla:not([hidden])') && !n.closest('[inert]'));
      const n = caja.querySelector(s);
      caja.scrollTop += n.getBoundingClientRect().top - caja.getBoundingClientRect().top - m;
    }, [scroll, selector, margen]);
    await espera(600);
  };
  /** Un dedo que arrastra de costado y se queda abajo (la foto, con el dedo todavía apoyado). */
  const arrastrar = async (x0, y, dx) => {
    await pagina.mouse.move(x0, y);
    await pagina.mouse.down();
    await pagina.mouse.move(x0 + dx, y + 3, { steps: 14 });
    await espera(350);
  };
  const levantar = async (x, y) => {
    await pagina.mouse.move(x, y, { steps: 3 });
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await espera(900);
  };
  const tocar = async (selector, ms = 1000) => {
    await pagina.evaluate((s) => [...document.querySelectorAll(s)].find((n) => n.offsetParent).click(), selector);
    await espera(ms);
  };

  if (toca('hoy')) {
    // Como hoy: Progreso con la entrada arriba a la derecha, Ascent bajando con el dedo y ya abajo.
    await ver('hoy', 'arriba', 1200);
    await foto('dva-01-hoy-progreso');
    await ver('hoy', 'medio', 1200);
    await foto('dva-02-hoy-bajando');
    await ver('hoy', undefined, 3200);
    await foto('dva-03-hoy-abierta');
  }

  if (toca('progreso')) {
    // Dentro de Progreso: Fuerza, carta por carta.
    await ver('enProgreso', undefined, 1800);
    await foto('dva-04-fuerza');
    await bajarA('.dva-scroll', '.dva-fuerza-carta', 120);
    await foto('dva-05-fuerza-tu-fuerza');
    // «¿Por qué no estás mejorando?» abre la otra propuesta; con «‹» se vuelve a Fuerza, a la misma altura.
    await tocar('.dva-fuerza-carta .dva-enlace', 2000);
    await foto('dva-05b-por-que');
    await tocar('.pqn-atras', 1500);
    const vuelta = await pagina.evaluate(() => document.querySelector('.dva-selector button:nth-of-type(2)').getAttribute('aria-selected'));
    if (vuelta !== 'true') throw new Error('Al volver de «¿Por qué no estás mejorando?», no quedó en Fuerza');
    await foto('dva-05c-de-vuelta');
    await bajarA('.dva-scroll', '.dva-metas-carta', 120);
    await foto('dva-06-fuerza-metas');
    await bajarA('.dva-scroll', '.dva-anio', 300);
    await foto('dva-07-fuerza-anio');
    // El selector cambiando con el dedo (a mitad de camino), y Cuerpo: Progreso tal cual.
    await ver('enProgreso', undefined, 1500);
    await arrastrar(120, 520, 150);
    await foto('dva-08-selector-deslizando');
    await levantar(330, 523);
    await foto('dva-09-cuerpo');
    await bajarA('.pg-scroll', '.pg-peso', 160);
    await foto('dva-10-cuerpo-bajando');
    // Tocar «Fuerza»: con el título ya ido, el selector queda arriba y la otra parte a la misma altura.
    await tocar('.dva-selector button:nth-of-type(2)', 1200);
    await foto('dva-11-fuerza-tocada');
    // Sin vincular: Fuerza invita a vincular.
    await ver('enProgresoSinVincular', undefined, 1500);
    await foto('dva-12-sin-vincular');
  }

  if (toca('scroll')) {
    // En un solo scroll: Progreso de siempre y, al final, Fuerza como un título más.
    await ver('enProgresoScroll', undefined, 1500);
    await foto('dva-13-scroll');
    await bajarA('.pg-scroll', '.dva-bloque', 120);
    await foto('dva-14-scroll-fuerza');
    await bajarA('.pg-scroll', '.dva-bloque .dva-fuerza-carta', 120);
    await foto('dva-15-scroll-fuerza-2');
  }

  if (toca('pestana')) {
    // Su propia pestaña: Fuerza en la barra; deslizar hacia Progreso; Inicio con Perfil arriba; Perfil creciendo.
    await ver('pestana', undefined, 1600);
    await foto('dva-16-pestana-fuerza');
    await arrastrar(300, 520, -150);
    await foto('dva-17-pestana-deslizando');
    await levantar(100, 523);
    await foto('dva-18-pestana-progreso');
    await tocar('.dva-barra .dva-pt-inicio', 1200);
    await foto('dva-19-pestana-inicio');
    await pagina.evaluate(() => document.querySelector('.dva-yo').click());
    await espera(180);
    await pagina.evaluate(() => document.getAnimations().forEach((a) => { if (a.effect && a.effect.target && a.effect.target.matches && a.effect.target.matches('.dva-perfil, .dva-pagina-inicio')) { a.pause(); a.currentTime = 90; } }));
    await espera(300);
    await foto('dva-20-perfil-creciendo');
    await pagina.evaluate(() => document.getAnimations().forEach((a) => { if (a.playState === 'paused') a.play(); }));
    await espera(1000);
    await foto('dva-21-perfil');
    await tocar('.dva-volver', 900);
    // Sin vincular: la barra de siempre, con Perfil abajo y sin el botón de arriba.
    await ver('pestanaSinVincular', undefined, 1600);
    await foto('dva-22-sin-vincular-inicio');
  }

  if (toca('quieto')) {
    // Con Reducir movimiento, nada se desliza ni crece: el selector, las pestañas y Perfil cambian de una. Lo de
    // adentro de las secciones (las copias y Progreso) es de la galería, no de esta propuesta: no se mira acá.
    await pagina.emulateMedia({ reducedMotion: 'reduce' });
    await ver('enProgreso', undefined, 900);
    await tocar('.dva-selector button:nth-of-type(1)', 0);
    const pulgar = await pagina.evaluate(() => document.querySelector('.dva-selector > i').style.transform);
    if (parseFloat((pulgar.match(/translateX\(([-\d.]+)/) || [])[1]) !== 0) throw new Error('Con Reducir movimiento, el selector se movió: ' + pulgar);
    await ver('pestana', undefined, 900);
    await tocar('.dva-barra .dva-pt-progreso', 0);
    const corrida = await pagina.evaluate(() => document.querySelector('.dva-pagina-progreso').style.translate);
    if (parseFloat(corrida) !== 0) throw new Error('Con Reducir movimiento, la pestaña se deslizó: ' + corrida);
    await tocar('.dva-barra .dva-pt-inicio', 0);
    await pagina.evaluate(() => document.querySelector('.dva-yo').click());
    const animando = await pagina.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.dva-pantalla') && !a.effect.target.closest('.pagina-app')).map((a) => (a.animationName || a.id || 'js') + ' en ' + a.effect.target.className));
    if (animando.length) throw new Error('Con Reducir movimiento, se mueve en la propuesta: ' + animando.join(', '));
    await foto('dva-25-quieto-perfil');
    await pagina.emulateMedia({ reducedMotion: 'no-preference' });
  }

  if (toca('ingles')) {
    await ver('en', undefined, 1800);
    await foto('dva-23-en-fuerza');
    await tocar('.dva-selector button:nth-of-type(1)', 1200);
    await foto('dva-24-en-cuerpo');
    // «¿Por qué no estás mejorando?» cerrada sin volver con «‹»: vuelven el vínculo y el idioma de antes (la sección
    // queda en Progreso, donde está esa pantalla).
    await tocar('.dva-selector button:nth-of-type(2)', 900);
    await tocar('.dva-fuerza-carta .dva-enlace', 1500);
    await propuesta('porQueNoMejoro', null);
    await espera(900);
    const sinVolver = await pagina.evaluate(() => ({ vinculada: Galeria.secciones.ascent.vinculada, idioma: Galeria.idioma }));
    if (sinVolver.vinculada !== antes.vinculada || sinVolver.idioma !== antes.idioma) throw new Error(`Al cerrar «¿Por qué no estás mejorando?» sin volver, no quedó como estaba: ${JSON.stringify(sinVolver)}`);
    await pestana(antes.pestana);
  }

  // Todo como estaba: el vínculo, el idioma y la sección.
  await propuesta(ID, null);
  await espera(600);
  const despues = await pagina.evaluate(() => ({ vinculada: Galeria.secciones.ascent.vinculada, idioma: Galeria.idioma, pestana: Galeria.pestana }));
  if (JSON.stringify(antes) !== JSON.stringify(despues)) throw new Error(`No quedó como estaba: ${JSON.stringify(antes)} → ${JSON.stringify(despues)}`);
}
