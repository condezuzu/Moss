// Los avisos a la vista y «Tu plan de sueño» (27/11, para aprobar): cada vista de la propuesta y lo que cambia al
// tocar. Con nombres después de `avisos-y-plan`, corre solo esas vistas (node … avisos-y-plan no alcanza: la
// herramienta toma cada nombre como un escenario; se eligen con SOLO=campanita,planNoche).
export default async function avisosYPlan({ pagina, foto, pestana, propuesta, espera }) {
  const solo = (process.env.SOLO || '').split(',').filter(Boolean);
  const toca = (nombre) => !solo.length || solo.includes(nombre);
  const ver = (vista, arg) => propuesta('avisosYPlan', vista, arg);
  // El toque va directo al botón: el clic de Playwright, si algo se acomoda mientras apunta, desplaza el teléfono
  // entero (es overflow: hidden, pero se deja desplazar desde el código) y las capturas siguientes salen corridas.
  const tocar = (selector, n = 0) => pagina.evaluate(([s, i]) => {
    const b = document.querySelectorAll(s)[i];
    if (!b) throw new Error('No encuentro ' + s);
    b.click();
  }, [selector, n]);
  const bajarHoja = (y) => pagina.evaluate((v) => { document.querySelector('.avp-lista').scrollTop = v; }, y);

  if (toca('campanita')) {
    // La primera vez, el globito de las estrellas tapa la frase del día: se va al marcar una estrella (que se desmarca).
    await pestana(4);
    await espera(1200);
    for (let i = 0; i < 3; i++) { await pagina.evaluate(() => window.__tocar('Escribir')); await espera(600); }
    await espera(4800);
    await ver('campanita');
    await espera(1800);
    await foto('avisos-01-campanita-globo');
    await tocar('.avp-globo');
    await espera(800);
    await foto('avisos-02-campanita');
    // Con el permiso de iOS apagado, tachada.
    await ver('campanita', 'sinPermiso');
    await espera(900);
    await foto('avisos-03-campanita-sin-permiso');
  }
  if (toca('avisos')) {
    await ver('avisos');
    await espera(1300);
    await foto('avisos-04-hoja');
    await bajarHoja(600);
    await espera(400);
    await foto('avisos-05-hoja-medio');
    await ver('avisosAbajo');
    await espera(1300);
    await foto('avisos-06-hoja-abajo');
  }
  if (toca('fila')) {
    await ver('fila');
    await espera(1500);
    await foto('avisos-07-fila-abierta');
    await ver('fila', 'plan');
    await espera(1500);
    await foto('avisos-08-fila-del-plan');
    // Las llaves cambian lo que dice cada fila: el segundo aviso del plan (acostarte) y la última comida grande.
    await tocar('.avp-fila[data-fila="plan"] .avp-mini .avp-llave');
    await tocar('.avp-fila[data-fila="ultimaComida"] .avp-fila-cab .avp-llave');
    await espera(700);
    await foto('avisos-09-dos-llaves-prendidas');
    // Un hábito: su aviso, dibujado simple (Leer va dentro de tu rutina de sueño).
    await ver('avisosAbajo');
    await espera(1000);
    await tocar('.avp-grupo .avp-fila-cab:has(.estrella)', 1);
    await espera(900);
    await foto('avisos-10-aviso-de-un-habito');
    // Pesarte, un miércoles: solo el día del control, y la vista previa dice ese día en lugar de la hora.
    await ver('fila', 'pesarte');
    await espera(1500);
    await foto('avisos-21-pesarte-el-dia-del-control');
    // Con la cena ya anotada: no suena, y su punto queda apagado.
    await pagina.evaluate(() => window.__widgets('pasarse'));
    await ver('fila');
    await espera(1500);
    await foto('avisos-22-cena-ya-anotada');
    await bajarHoja(0);
    await espera(400);
    await foto('avisos-23-cena-ya-anotada-arriba');
    await propuesta('avisosYPlan', null);
    await pagina.evaluate(() => window.__widgets('noPasarse'));
    await espera(400);
  }
  if (toca('comoSeVen')) {
    await ver('comoSeVen');
    await espera(2400);
    await foto('avisos-11-como-se-ven');
    await ver('comoSeVen', { hora: 18 * 60 + 5 });
    await espera(2400);
    await foto('avisos-12-como-se-ven-a-la-tarde');
  }
  if (toca('sinPermiso')) {
    await ver('sinPermiso');
    await espera(1300);
    await foto('avisos-13-sin-permiso');
    await ver('sinPermiso', 'sinPedir');
    await espera(1300);
    await foto('avisos-14-sin-pedir');
  }
  if (toca('tocar')) {
    // Lo que cambia al tocar: activar la sugerencia, un punto de la línea y un máximo más chico.
    await ver('avisos');
    await espera(1200);
    await tocar('.avp-tarjeta .avp-boton');
    await espera(700);
    await foto('avisos-15-para-ti-activada');
    // La sugerencia dice «Listo» un momento y se pliega.
    await espera(2000);
    await tocar('.avp-pt', 3);
    await espera(500);
    await foto('avisos-16-un-punto-tocado');
    await bajarHoja(99999);
    await espera(300);
    await tocar('.avp-num', 2);
    await espera(700);
    await foto('avisos-17-maximo-cuatro');
  }
  if (toca('chip')) {
    await ver('chip');
    await espera(1100);
    await foto('avisos-18-chip-apagado');
    await tocar('.avp-chip');
    await espera(900);
    await foto('avisos-19-chip-recien-encendido');
    await espera(3200);
    await foto('avisos-20-chip-encendido');
  }
  if (toca('planDia')) {
    await ver('planDia');
    await espera(1600);
    await foto('plan-01-de-dia');
  }
  if (toca('planNoche')) {
    // Sin rutina todavía: la tarjeta del periodo, con la invitación a armarla.
    await ver('sinRutina');
    await espera(1500);
    await foto('plan-02-sin-rutina');
    // Leer ya está encendida en el cielo de la galería: en el plan sale tildada (es la misma marca). Tildarla acá
    // apagaría su estrella, así que se tildan los otros.
    await ver('planNoche');
    await espera(1900);
    await foto('plan-03-de-noche');
    await tocar('.avp-plan .avp-tilde', 0);
    await espera(800);
    await foto('plan-04-dos-pasos-tildados');
    await tocar('.avp-plan .avp-tilde', 2);
    await tocar('.avp-plan .avp-tilde', 3);
    await espera(800);
    await foto('plan-05-todos-hechos');
    await tocar('.avp-plan-pie .avp-quieto');
    await espera(900);
    await foto('plan-06-esta-noche-no');
  }
  if (toca('armar')) {
    await ver('armar');
    await espera(2900);
    await foto('plan-07-armar-con-la-ducha');
    // Dos horas antes: empieza antes que la ducha, que ya no lo adelanta (la nota se va).
    await tocar('.avp-armar .avp-seccion .avp-pildora', 4);
    await espera(800);
    await foto('plan-08-armar-dos-horas');
    await tocar('.avp-armar .avp-seccion .avp-pildora', 2);
    await tocar('.avp-crear');
    await espera(1700);
    await foto('plan-09-rutina-creada');
  }
  if (toca('margen')) {
    await ver('margen');
    await espera(1500);
    await foto('plan-10-cuanto-antes');
    await tocar('.avp-margen .avp-pildora', 2);
    await espera(700);
    await foto('plan-11-cuanto-antes-30');
    await ver('margen', 'sinReloj');
    await espera(1500);
    await foto('plan-12-cuanto-antes-sin-reloj');
  }
  if (toca('nocheEntera')) {
    await ver('nocheEntera');
    await espera(1700);
    await foto('plan-13-noche-entera');
    await tocar('.avp-noche .avp-tilde', 0);
    await espera(800);
    await foto('plan-14-noche-entera-dos-pasos');
    // «Ahora», con la rutina empezada (a las 22:36, anotar lo que tienes en la cabeza).
    await ver('nocheEntera', { ahora: 22 * 60 + 36 });
    await espera(1700);
    await foto('plan-15-noche-entera-ahora');
  }
  if (toca('en')) {
    await pagina.evaluate(() => window.__idioma('en'));
    await ver('en');
    await espera(1700);
    await foto('en-01-avisos');
    await bajarHoja(600);
    await espera(400);
    await foto('en-02-avisos-medio');
    await tocar('.avp-avisos .hb-cerrar');
    await espera(1000);
    await foto('en-03-plan');
    await ver('nocheEntera');
    await espera(1500);
    await foto('en-04-noche-entera');
    await ver('comoSeVen');
    await espera(2400);
    await foto('en-05-como-se-ven');
  }
  await propuesta('avisosYPlan', null);
  await pagina.evaluate(() => window.__idioma('es'));
  await espera(400);
}
