// Los despertares de la noche sin reloj (28/11, para aprobar): un despertar (y tocado, en la lista y en el arco),
// dos, te levantaste con pasos, uno largo, sin despertares, en inglés, cómo se veía antes, el arco a mitad de
// dibujarse y con Reducir movimiento.
export default async function despertares({ pagina, foto, propuesta, espera }) {
  const P = 'despertares';
  const tocar = (selector) => pagina.evaluate((s) => document.querySelector(s).click(), selector);
  // Toca el arco donde cae un despertar: el medio de su corte, en la pantalla.
  const tocarCorte = async (i) => {
    const caja = await pagina.evaluate((k) => {
      const r = document.querySelector(`.dsp-arco .dsp-corte[data-i="${k}"]`).getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, i);
    await pagina.mouse.click(caja.x, caja.y);
    await pagina.mouse.move(1, 1);
  };
  const bajarA = (selector) => pagina.evaluate((s) => {
    const sc = document.querySelector('.dsp-scroll'), n = document.querySelector(s);
    sc.scrollTop += n.getBoundingClientRect().top - sc.getBoundingClientRect().top - 70;
  }, selector);

  // El arco a mitad de dibujarse: el render por software no llega a tiempo, así que se frena en un instante.
  await propuesta(P, 'uno');
  await espera(80);
  await pagina.evaluate(() => document.getAnimations().filter((a) => (a.animationName || '').startsWith('dsp-')).forEach((a) => { a.pause(); a.currentTime = 300; }));
  await espera(300);
  await foto('despertares-dibujandose');
  await pagina.evaluate(() => document.getAnimations().filter((a) => (a.animationName || '').startsWith('dsp-')).forEach((a) => a.play()));
  await espera(2200);
  await foto('despertares-uno');

  await tocar('.dsp-desp');
  await espera(900);
  await foto('despertares-uno-tocado');
  await bajarA('.dsp-texto');
  await espera(500);
  await foto('despertares-uno-abajo');

  await propuesta(P, 'dos');
  await espera(2400);
  await foto('despertares-dos');
  await tocarCorte(1);
  await espera(900);
  await foto('despertares-dos-tocado-en-el-arco');

  for (const v of ['bano', 'largo', 'ninguno', 'antes']) {
    await propuesta(P, v);
    await espera(2400);
    await foto('despertares-' + v);
  }

  await propuesta(P, 'en');
  await espera(2400);
  await foto('despertares-en');
  await tocar('.dsp-desp');
  await espera(900);
  await foto('despertares-en-tocado');

  // Con Reducir movimiento: todo quieto, y tocar resalta de una.
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await propuesta(P, 'dos');
  await espera(300);
  await tocar('.dsp-desp:nth-child(2)');
  await espera(150);
  await foto('despertares-quieto');
  await pagina.emulateMedia({ reducedMotion: 'no-preference' });

  await propuesta(P, null);
  await espera(900);
  await foto('despertares-al-cerrar');
}
