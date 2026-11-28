// La sección de Ascent en Progreso, con avisos (propuesta C, 27/11, para aprobar): la carta en Progreso, creciendo y
// crecida, descartar un aviso deslizándolo, el aviso de fatiga abierto, la tarjeta de Inicio, el aviso en el teléfono,
// cada día de ejemplo (en calma, todavía se recupera, noche corta, ya entrenó, descanso y recién vinculada) en la
// página y en la carta, las partes abiertas, sin vincular, en inglés y con otro rango (la luz cambia de color).
// Con SOLO=progreso,dias… corre solo esas tandas.
export default async function ascentEnProgreso({ pagina, foto, pestana, propuesta, espera }) {
  const solo = (process.env.SOLO || '').split(',').filter(Boolean);
  const toca = (nombre) => !solo.length || solo.includes(nombre);
  const ID = 'ascentEnProgreso';
  const ver = async (vista, arg, ms = 1700) => {
    await propuesta(ID, vista, arg);
    await espera(ms);
  };
  /** Baja la página (o el aviso abierto) hasta que `selector` queda a `margen` px del borde de arriba. */
  const bajarA = async (selector, margen = 90) => {
    await pagina.evaluate(([s, m]) => {
      const sc = document.querySelector('.apr-pagina .apr-detalle .apr-scroll') || document.querySelector('.apr-pagina > .apr-scroll');
      const n = sc.querySelector(s);
      sc.scrollTop += n.getBoundingClientRect().top - sc.getBoundingClientRect().top - m;
    }, [selector, margen]);
    await espera(600);
  };
  // Un toque por código: el clic de Playwright, si lo tocado queda debajo de la barra, corre el teléfono entero (.tel)
  // para alcanzarlo, y las capturas siguientes salen corridas.
  const tocar = async (selector, ms = 900) => {
    await pagina.evaluate((s) => document.querySelector(s).click(), selector);
    await espera(ms);
  };
  // Lo que se mueve, frenado en un instante: el render por software no llega a tiempo.
  const frenarEn = (ms) => pagina.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), ms);
  const soltar = () => pagina.evaluate(() => document.getAnimations().forEach((a) => { if (a.playState === 'paused') a.play(); }));

  if (toca('progreso')) {
    await ver('progreso', undefined, 2000);
    await foto('c-01-progreso');
    // La carta crece hasta la página: a mitad de camino y crecida.
    await propuesta(ID, 'aviso');
    await frenarEn(120);
    await espera(400);
    await foto('c-02-creciendo');
    await soltar();
    await espera(1600);
    await foto('c-03-crecida');
    await bajarA('.apr-partes', 150);
    await foto('c-04-crecida-partes');

    // Descartar el primer aviso deslizándolo de costado: con el dedo todavía abajo y después.
    await ver('aviso');
    const r = await pagina.evaluate(() => { const b = document.querySelector('.apr-aviso').getBoundingClientRect(); return { x: b.left, y: b.top, ancho: b.width, alto: b.height }; });
    await pagina.mouse.move(r.x + r.ancho * 0.5, r.y + r.alto * 0.5);
    await pagina.mouse.down();
    await pagina.mouse.move(r.x + r.ancho * 0.5 - 120, r.y + r.alto * 0.5 + 4, { steps: 12 });
    await espera(400);
    await foto('c-05-descartando');
    await pagina.mouse.move(r.x + r.ancho * 0.5 - 200, r.y + r.alto * 0.5 + 6, { steps: 4 });
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await espera(1500);
    await foto('c-06-descartado');

    // El aviso de fatiga, abierto: crece desde el aviso.
    await ver('avisoAbierto', undefined, 2400);
    await foto('c-07-aviso-abierto');
    await bajarA('.apr-det-bloque:nth-of-type(2)', 70);
    await foto('c-08-aviso-abierto-2');
    await bajarA('.apr-det-botones', 560);
    await foto('c-09-aviso-abierto-3');
    // «Me siento bien»: el aviso abierto se encoge y el aviso queda en una línea con el dato y lo anotado.
    await tocar('.apr-det-botones .apr-boton:not(.principal)', 1500);
    await foto('c-09b-me-siento-bien');
    // Y la carta, al volver a Progreso, con lo anotado.
    await tocar('.apr-volver', 1300);
    await foto('c-09e-me-siento-bien-carta');
    // El aviso abierto también se cierra arrastrándolo hacia abajo desde arriba de todo.
    await ver('avisoAbierto', undefined, 2400);
    await pagina.mouse.move(200, 200);
    await pagina.mouse.down();
    await pagina.mouse.move(200, 330, { steps: 8 });
    await espera(300);
    await foto('c-09c-aviso-abierto-tirando');
    await pagina.mouse.move(200, 430, { steps: 6 });
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await espera(1300);
    await foto('c-09d-aviso-abierto-cerrado');
  }

  if (toca('afuera')) {
    await ver('inicio', undefined, 1800);
    await foto('c-10-inicio');
    await ver('telefono', undefined, 1600);
    await foto('c-11-telefono');
  }

  if (toca('dias')) {
    await ver('calma');
    await foto('c-12-calma');
    await ver('calma', 'carta', 1600);
    await foto('c-13-calma-carta');
    await ver('casi');
    await foto('c-14-casi');
    await ver('casi', 'carta', 1600);
    await foto('c-15-casi-carta');
    await ver('nocheCorta');
    await foto('c-16-noche-corta');
    await ver('nocheCorta', 'inicio', 1600);
    await foto('c-17-noche-corta-inicio');
    await ver('hecha', undefined, 2000);
    await foto('c-18-hecha');
    await ver('hecha', 'carta', 1600);
    await foto('c-19-hecha-carta');
    await ver('descanso', undefined, 1800);
    await foto('c-20-descanso');
    await ver('descanso', 'pagina');
    await tocar('.apr-parte.hoy .apr-parte-fila', 1000);
    await foto('c-21-descanso-pagina');
    await ver('descanso', 'inicio', 1400);
    await foto('c-22-descanso-inicio');
    await ver('nueva');
    await foto('c-23-nueva');
    await ver('nueva', 'carta', 1600);
    await foto('c-24-nueva-carta');
  }

  if (toca('partes')) {
    await ver('partes', undefined, 2000);
    await bajarA('.apr-parte.semana', 70);
    await foto('c-25-partes-semana');
    await bajarA('.apr-parte.fuerza', 70);
    await foto('c-26-partes-fuerza');
    await bajarA('.apr-parte.fuerza .apr-fz.bajo', 120);
    await foto('c-27-partes-fuerza-2');
    // «¿Por qué no estás mejorando?» (la otra propuesta) y «‹», que vuelve a la página como estaba.
    await tocar('.apr-fz.sinSubidaClara .apr-porque', 2400);
    await foto('c-27b-por-que-no-mejoro');
    await tocar('.pqn-atras', 1600);
    await foto('c-27c-de-vuelta');
    // Hoy, con el porqué de un ejercicio; las metas y el año.
    await ver('aviso', undefined, 1600);
    await tocar('.apr-parte.hoy .apr-parte-fila');
    await tocar('.apr-parte.hoy .apr-ej:nth-child(3)', 700);
    await bajarA('.apr-parte.hoy', 70);
    await foto('c-28-partes-hoy');
    await tocar('.apr-parte.hoy .apr-parte-fila');
    await tocar('.apr-parte.metas .apr-parte-fila', 1200);
    await bajarA('.apr-parte.metas', 70);
    await foto('c-29-partes-metas');
    await tocar('.apr-parte.metas .apr-parte-fila');
    await tocar('.apr-parte.anio .apr-parte-fila', 1200);
    await bajarA('.apr-parte.anio', 70);
    await foto('c-30-partes-anio');
  }

  if (toca('otros')) {
    await ver('sinVincular', undefined, 1600);
    await foto('c-31-sin-vincular');
    // Con otro rango, la luz es la de su cuerpo: Marte (rango 4).
    const rango = await pagina.evaluate(() => Object.assign({}, window.Galeria.secciones.ascent.rango));
    await pagina.evaluate(() => window.__ascent('rango', [4, 'Marte']));
    await ver('progreso', undefined, 1600);
    await foto('c-32-rango-marte-carta');
    await ver('aviso', undefined, 1800);
    await foto('c-33-rango-marte');
    await pagina.evaluate((r) => window.__ascent('rango', [r.rango, r.planeta]), rango);
  }

  if (toca('en')) {
    await pagina.evaluate(() => window.__idioma('en'));
    await ver('en', undefined, 1800);
    await foto('c-34-en');
    await ver('en', 'pagina', 1800);
    await foto('c-35-en-aviso');
    await ver('en', 'detalle', 2400);
    await foto('c-36-en-aviso-abierto');
    // Desde «En inglés», «¿Por qué no estás mejorando?» también en inglés.
    await ver('en', 'pagina', 1800);
    await tocar('.apr-parte.fuerza .apr-parte-fila', 1200);
    await bajarA('.apr-fz.sinSubidaClara', 220);
    await tocar('.apr-fz.sinSubidaClara .apr-porque', 2400);
    await foto('c-37-en-por-que');
    await tocar('.pqn-atras', 1600);
    await pagina.evaluate(() => window.__idioma('es'));
  }

  // Como estaba: la propuesta cerrada, el teléfono en su lugar y en Inicio.
  await propuesta(ID, null);
  await espera(600);
  await pagina.evaluate(() => { const t = document.querySelector('.tel'); if (t) t.scrollTop = 0; });
  await pestana(0);
}
