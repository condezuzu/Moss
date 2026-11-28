// «¿Por qué?» dentro de Ascent (28/11, para aprobar): los cinco cerrados, uno a mitad de abrirse y dibujándose, cada
// uno abierto, las fuentes desplegadas, cómo se ve hoy (los párrafos de la app), en inglés y con Reducir movimiento.
export default async function porQueEnAscent({ pagina, foto, propuesta, espera }) {
  const P = 'porQueEnAscent';
  // El render por software no llega a tiempo: para ver un movimiento, se frenan en un instante las animaciones de la
  // propuesta (las que llevan nombre o keyframes «pqa-»).
  const frenarEn = (ms) => pagina.evaluate((t) => document.getAnimations().filter((a) => (a.id || a.animationName || '').startsWith('pqa-')).forEach((a) => { a.pause(); a.currentTime = t; }), ms);
  const soltar = () => pagina.evaluate(() => document.getAnimations().filter((a) => (a.id || a.animationName || '').startsWith('pqa-')).forEach((a) => a.play()));
  const tocar = (selector) => pagina.evaluate((s) => document.querySelector(s).click(), selector);

  await propuesta(P, 'cerrado');
  await espera(1400);
  await foto('por-que-ascent-cerrado');

  // Tocar «¿Por qué?» de Esta semana: a mitad de abrirse.
  await tocar('.pqa-bloque[data-de="musculos"] .pqa-abrir');
  await frenarEn(120);
  await espera(300);
  await foto('por-que-ascent-abriendo');
  await frenarEn(420);
  await espera(300);
  await foto('por-que-ascent-dibujandose');
  await soltar();
  await espera(2200);

  for (const v of ['semana', 'fatigados', 'estancados', 'porQue', 'metas']) {
    await propuesta(P, v);
    await espera(2400);
    await foto('por-que-ascent-' + v);
  }

  // Las fuentes, desplegadas.
  await propuesta(P, 'semana');
  await espera(1800);
  await tocar('.pqa-bloque[data-de="musculos"] .pqa-fuentes-cab');
  await espera(1400);
  await foto('por-que-ascent-fuentes');

  await propuesta(P, 'antes');
  await espera(1600);
  await foto('por-que-ascent-antes');

  await propuesta(P, 'en');
  await espera(2400);
  await foto('por-que-ascent-en');

  // Con Reducir movimiento: se abre de una, sin moverse.
  await propuesta(P, 'cerrado');
  await espera(1200);
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await tocar('.pqa-bloque[data-de="fatigados"] .pqa-abrir');
  await espera(150);
  await foto('por-que-ascent-quieto');
  await pagina.emulateMedia({ reducedMotion: 'no-preference' });

  await propuesta(P, null);
  await pagina.evaluate(() => { if (window.Galeria.idioma !== 'es') window.__idioma('es'); });
  await espera(900);
  await foto('por-que-ascent-al-cerrar');
}
