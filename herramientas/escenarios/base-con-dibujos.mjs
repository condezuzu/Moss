// «En qué se basa Moss», con dibujos (27/11, para aprobar): la portada con los cuatro sellos como columnas, la retícula
// de fichas con su filtro (arriba, filtrada, a mitad de acomodarse y abajo de todo), una ficha creciendo desde su marco
// (a mitad de camino y ya crecida, con sus fuentes abiertas), otra abierta desde su píldora de la portada, «¿Por qué me
// dice esto?» en sus dos ejemplos y, en inglés, la retícula y una ficha.
export default async function baseConDibujos({ pagina, foto, propuesta, espera }) {
  const P = 'baseConDibujos';
  // El render por software no llega a tiempo: para ver un movimiento, se frenan en un instante las animaciones de la
  // propuesta (las que llevan nombre: «bd-ficha» y «bd-filtro»).
  const frenarEn = (ms) => pagina.evaluate((t) => document.getAnimations().filter((a) => (a.id || '').startsWith('bd-')).forEach((a) => { a.pause(); a.currentTime = t; }), ms);
  const soltar = () => pagina.evaluate(() => document.getAnimations().filter((a) => (a.id || '').startsWith('bd-')).forEach((a) => a.play()));
  const tocar = (selector) => pagina.evaluate((s) => document.querySelector(s).click(), selector);
  const bajar = (selector, y) => pagina.evaluate(([s, v]) => { const n = document.querySelector(s); n.scrollTop = v === 'fin' ? n.scrollHeight : v; }, [selector, y]);

  // Cuánto confiar: arriba y, un poco más abajo, el cuadro entero.
  await propuesta(P, 'portada');
  await espera(2400);
  await foto('base-dibujos-portada');
  await bajar('.bd-scroll', 170);
  await espera(500);
  await foto('base-dibujos-portada-cuadro');

  // Una cifra por tema: la retícula, el filtro acomodándola y abajo de todo.
  await propuesta(P, 'cifras');
  await espera(2200);
  await foto('base-dibujos-cifras');
  await tocar('.bd-filtro [data-area="sueno"]');
  await frenarEn(110);
  await espera(250);
  await foto('base-dibujos-filtro-acomodando');
  await soltar();
  await espera(1700);
  await foto('base-dibujos-filtro-sueno');
  await tocar('.bd-filtro [data-area="todo"]');
  await espera(900);
  await bajar('.bd-scroll', 'fin');
  await espera(1800);
  await foto('base-dibujos-cifras-final');

  // Una ficha: la de la noche corta crece desde su tarjeta, y vuelve a ella.
  await tocar('.bd-filtro [data-area="entreno"]');
  await espera(1500);
  await tocar('.bd-ficha[data-id="noche"]');
  await frenarEn(75);
  await espera(250);
  await foto('base-dibujos-ficha-creciendo');
  await soltar();
  await espera(2200);
  await foto('base-dibujos-ficha');
  await tocar('.bd-fuentes-cab');
  await espera(1300);
  await foto('base-dibujos-ficha-fuentes');
  await tocar('.bd-capa-cerrar');
  await frenarEn(110);
  await espera(250);
  await foto('base-dibujos-ficha-volviendo');
  await soltar();
  await espera(900);

  // Otra, de peso: la fecha de llegada, con su botón de la galería.
  await propuesta(P, 'ficha2');
  await espera(3200);
  await foto('base-dibujos-ficha2');

  // Las que cambió la revisión del 27/11: el déficit según el cuidado (con sus fuentes), las series como convención, la
  // cintura según la spec y, con los números de Sueño y de Ascent, el periodo y la calidad de anoche.
  for (const id of ['cuidados', 'series', 'cintura', 'periodo', 'calidad']) {
    await propuesta(P, 'ficha', id);
    await espera(2600);
    await foto('base-dibujos-ficha-' + id);
    if (id === 'cuidados') {
      await tocar('.bd-fuentes-cab');
      await espera(1300);
      await foto('base-dibujos-ficha-cuidados-fuentes');
    }
  }

  // Desde la portada: tocar una píldora lleva a su ficha (la deuda de sueño).
  await propuesta(P, 'portada');
  await espera(1600);
  await tocar('.bd-pildora[data-id="deuda"]');
  await frenarEn(75);
  await espera(250);
  await foto('base-dibujos-pildora-creciendo');
  await soltar();
  await espera(2200);
  await foto('base-dibujos-pildora-ficha');

  // ¿Por qué me dice esto?: en Ascent y en Inicio; plegada y vuelta a desplegar, se dibuja otra vez.
  await propuesta(P, 'porque');
  await espera(3400);
  await foto('base-dibujos-porque');
  await bajar('.bd-scroll', 'fin');
  await espera(2800);
  await foto('base-dibujos-porque-inicio');

  // En inglés: la retícula y una ficha.
  await pagina.evaluate(() => window.__idioma('en'));
  await propuesta(P, 'en');
  await espera(2400);
  await foto('base-dibujos-en');
  await tocar('.bd-ficha[data-id="control"]');
  await espera(2600);
  await foto('base-dibujos-en-ficha');
  await propuesta(P, 'ficha', 'cuidados');
  await espera(2600);
  await foto('base-dibujos-en-ficha-cuidados');
  await propuesta(P, 'portada');
  await espera(1800);
  await foto('base-dibujos-en-portada');
  await propuesta(P, 'porque');
  await espera(3400);
  await foto('base-dibujos-en-porque');
  await pagina.evaluate(() => window.__idioma('es'));
  await propuesta(P, null);
  await espera(400);
}
