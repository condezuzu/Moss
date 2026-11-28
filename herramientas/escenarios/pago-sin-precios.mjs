// La pantalla de pago mientras faltan los precios (27/11, para aprobar): esperando la primera respuesta, sin conexión,
// la tienda sin un plan, un solo plan, reintentando y «Restaurar» con un plan sin precio, quietas; después, los precios
// que llegan (a mitad del fundido y al final) y «Reintentar» tocado de verdad. En es y en.
export default async function pagoSinPrecios({ pagina, foto, propuesta, espera }) {
  for (const idioma of ['es', 'en']) {
    await pagina.evaluate((i) => window.__idioma(i), idioma);
    const sufijo = idioma === 'en' ? '-en' : '';
    for (const v of ['esperando', 'sinConexion', 'faltaEnLaTienda', 'unSoloPlan', 'reintentando', 'restaurar']) {
      await propuesta('pagoSinPrecios', v, { quieto: true });
      await espera(900);
      await foto(`psp-${v}${sufijo}`);
    }
    // Llegan a los 1,6 s: a mitad del fundido se ven lo viejo yéndose y lo nuevo entrando.
    await propuesta('pagoSinPrecios', 'llegan');
    await espera(1680);
    await foto(`psp-llegan-fundido${sufijo}`);
    await espera(1500);
    await foto(`psp-llegan${sufijo}`);
    // «Reintentar», tocado: la ruedita y, al llegar, los precios.
    await propuesta('pagoSinPrecios', 'faltaEnLaTienda');
    await espera(900);
    await pagina.click('.psp-boton');
    await espera(500);
    await foto(`psp-reintentar-tocado${sufijo}`);
    await espera(2200);
    await foto(`psp-reintentar-llegaron${sufijo}`);
  }
  await pagina.evaluate(() => window.__idioma('es'));
  await propuesta('pagoSinPrecios', null);
  await espera(500);
}
