// «¿Tienes un código?» en la pantalla de pago (27/11, para aprobar): el enlace, la hoja de Apple para canjear
// (dibujada), la oferta con el código, un código que no vale, lo que queda al confirmar y en inglés.
export default async function codigoEnElPago({ pagina, foto, propuesta, espera }) {
  for (const v of ['pago', 'hoja', 'oferta', 'noValido']) {
    await propuesta('codigoEnElPago', v);
    await espera(900);
    await foto(`codigo-${v}`);
  }
  await propuesta('codigoEnElPago', 'oferta');
  await espera(700);
  await pagina.click('.sb-apple .cod-paso .sb-apple-si');
  await espera(2600);
  await foto('codigo-confirmado');
  await pagina.evaluate(() => window.__idioma('en'));
  for (const v of ['pago', 'oferta']) {
    await propuesta('codigoEnElPago', v);
    await espera(900);
    await foto(`codigo-${v}-en`);
  }
  await pagina.evaluate(() => window.__idioma('es'));
  await propuesta('codigoEnElPago', null);
  await espera(500);
}
