// Al abrir Moss (27/11, para aprobar): la entrada escalonada de Inicio, como en Ascent, en tres medidas. Cada una, a
// mitad de camino (las animaciones frenadas en ese instante: el render por software no llega a tiempo) y ya quieta.
export default async function alAbrir({ pagina, foto, propuesta, espera }) {
  const frenarEn = (ms) => pagina.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), ms);
  const soltar = () => pagina.evaluate(() => document.getAnimations().forEach((a) => a.play()));
  for (const v of ['ascent', 'luna', 'marcada']) {
    await propuesta('alAbrir', v);
    await frenarEn(170);
    await espera(250);
    await foto(`al-abrir-${v}-1`);
    await frenarEn(330);
    await espera(250);
    await foto(`al-abrir-${v}-2`);
    await soltar();
    await espera(1600);
    await foto(`al-abrir-${v}-3`);
  }
  await propuesta('alAbrir', null);
}
