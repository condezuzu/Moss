// «Decir lo que comí», mejor (27/11, para aprobar): el micrófono en sus tres formas (quieto, el toque a mitad de
// camino, escuchando y al parar, con las animaciones frenadas en ese instante: el render por software no llega a
// tiempo), con Reducir movimiento, el batido con lo que lleva, guardarlo como receta, guardada, la próxima vez por su
// nombre (cerrada y abierta) y en inglés. Y lo que se toca: escribir a mano y entender, parar a mitad, cambiar y
// quitar, «Agregar» (anota en la cena y la hoja baja), lo tuyo agregado y cambiar el idioma con la propuesta abierta.
export default async function decirMejor({ pagina, foto, propuesta, espera }) {
  // «Deshacer» del aviso de Comida, para dejar el día como estaba (el aviso ya puede haberse ido: se toca igual).
  const deshacer = () => pagina.evaluate(() => { const b = document.querySelector('.cm-aviso .cm-aviso-btn'); if (b) b.click(); });
  // Solo las de la propuesta: la entrada de la pantalla queda como está.
  const frenarEn = (ms) => pagina.evaluate((t) => document.querySelectorAll('.dme-cuerpo, .dme-cuerpo *').forEach((n) => n.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; })), ms);
  const soltar = () => pagina.evaluate(() => document.querySelectorAll('.dme-cuerpo, .dme-cuerpo *').forEach((n) => n.getAnimations().forEach((a) => a.play())));
  for (const v of ['microfono', 'barras', 'aro']) {
    await propuesta('decirMejor', v, 'quieto');
    await espera(800);
    if (v === 'microfono') await foto('decir-mejor-quieto');
    await propuesta('decirMejor', v, 'toque');
    await frenarEn(110);
    await espera(250);
    await foto(`decir-mejor-${v}-toque`);
    await frenarEn(400);
    await espera(250);
    await foto(`decir-mejor-${v}-sale`);
    await soltar();
    await propuesta('decirMejor', v, 'escuchando');
    await espera(1800);
    await foto(`decir-mejor-${v}-escuchando`);
    // Al parar, tocando: lo que respira se recoge.
    await pagina.click('.dme-mic');
    await frenarEn(150);
    await espera(250);
    await foto(`decir-mejor-${v}-parar`);
    await soltar();
  }
  // Parado a mitad: se entiende lo dicho hasta ahí, no la frase entera.
  await espera(1200);
  await foto('decir-mejor-parado-a-mitad');
  // Sin arg: se toca solo, escucha la frase y la entiende.
  await propuesta('decirMejor', 'microfono');
  await espera(6500);
  await foto('decir-mejor-microfono-entendido');
  // Tocar de nuevo: lo de antes sale con su animación y empieza otro dictado (uno solo).
  await pagina.click('.dme-mic');
  await espera(120);
  await foto('decir-mejor-de-nuevo-saliendo');
  await espera(1400);
  await pagina.click('.dme-mic');
  await espera(200);
  await pagina.click('.dme-mic');
  await espera(2600);
  await foto('decir-mejor-de-nuevo-un-dictado');
  // Con Reducir movimiento: solo el ícono y el color.
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  for (const v of ['microfono', 'barras', 'aro']) {
    await propuesta('decirMejor', v, 'escuchando');
    await espera(600);
    await foto(`decir-mejor-${v}-reducido`);
  }
  await pagina.emulateMedia({ reducedMotion: 'no-preference' });
  // Escrito a mano: «Entender» se habilita y entiende lo escrito.
  await propuesta('decirMejor', 'microfono', 'quieto');
  await espera(700);
  await pagina.fill('.dme-pantalla .dc-area', 'dos huevos revueltos y un café con leche');
  await espera(400);
  await foto('decir-mejor-escrito-a-mano');
  await pagina.click('.dme-pie .fi-secundario');
  await espera(1000);
  await foto('decir-mejor-escrito-entendido');
  for (const v of ['batido', 'guardar', 'guardado', 'nombre']) {
    await propuesta('decirMejor', v);
    await espera(1200);
    await foto(`decir-mejor-${v}`);
  }
  await propuesta('decirMejor', 'nombre', 'abierta');
  await espera(1200);
  await foto('decir-mejor-nombre-abierta');
  // De «batido» a «guardar» y a «guardado» tocando, como lo haría alguien.
  await propuesta('decirMejor', 'batido');
  await espera(900);
  await pagina.click('.dme-guardar-b');
  await espera(260);
  await foto('decir-mejor-guardar-creciendo');
  await espera(700);
  await pagina.fill('.dme-campo input', 'Batido de la mañana');
  await pagina.click('.dme-guardar-ok');
  await espera(900);
  await foto('decir-mejor-guardado-tocando');
  // Cambiar y quitar: una banana más y sin la avena; el total y «Agregar» siguen.
  await propuesta('decirMejor', 'batido');
  await espera(1000);
  await pagina.click('.dme-plato-lista > .dc-bloque:nth-child(1) .dc-pasos .fi-paso:last-child');
  await espera(300);
  await pagina.click('.dme-plato-lista > .dc-bloque:nth-child(3) .rv-quitar');
  await espera(120);
  await foto('decir-mejor-quitando');
  await espera(800);
  await foto('decir-mejor-batido-cambiado');
  // «Agregar»: lo anota el «Decir» de la galería en la cena, con lo cambiado, y la hoja baja hasta Comida.
  await pagina.click('.dme-pie .fi-agregar');
  await espera(200);
  await foto('decir-mejor-agregando');
  await espera(1300);
  await foto('decir-mejor-agregado');
  await deshacer();
  await espera(700);
  // Lo tuyo, dicho por su nombre: una sola cosa en la cena.
  await propuesta('decirMejor', 'nombre');
  await espera(1000);
  await pagina.click('.dme-pie .fi-agregar');
  await espera(1500);
  await foto('decir-mejor-receta-agregada');
  await deshacer();
  await espera(700);
  // El idioma con la propuesta abierta: se vuelve a pintar.
  await propuesta('decirMejor', 'batido');
  await espera(900);
  await pagina.evaluate(() => window.__idioma('en'));
  await espera(1200);
  await foto('decir-mejor-idioma-cambiado');
  await pagina.evaluate(() => window.__idioma('es'));
  await espera(600);
  await propuesta('decirMejor', 'en');
  await espera(1200);
  await foto('decir-mejor-en-batido');
  await propuesta('decirMejor', 'en', 'nombre');
  await espera(1200);
  await foto('decir-mejor-en-nombre');
  await propuesta('decirMejor', null);
  await espera(500);
}
